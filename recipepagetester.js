
// Custom error class for recipe page
function RecipeError(message) {
    this.name = "RecipeError";
    this.message = message || "An error occurred loading the recipe";
}
RecipeError.prototype = Object.create(Error.prototype);
RecipeError.prototype.constructor = RecipeError;

// Show error messages on recipe page
function showRecipeError(message) {
    var errorDiv = document.createElement("div");
    errorDiv.style.cssText = "background-color: #ff6b6b; color: white; padding: 20px; margin: 20px; border-radius: 5px; text-align: center;";
    errorDiv.innerHTML = "<h3>Error</h3><p>" + message + "</p>";
    
    var recipeDetails = document.getElementById('recipeDetails');
    if (recipeDetails) {
        recipeDetails.innerHTML = "";
        recipeDetails.appendChild(errorDiv);
    } else {
        document.body.appendChild(errorDiv);
    }
}

async function extractRecipeDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeUrl = urlParams.get("recipeUrl");

    try {
        if (!recipeUrl) {
            throw new RecipeError("No recipe URL provided. Please go back and select a recipe.");
        }
        
        const apiKey = '075b51dbcd4d4419836f94c406a94c50'; 

        const response = await fetch(`https://api.spoonacular.com/recipes/extract?url=${encodeURIComponent(recipeUrl)}&apiKey=${apiKey}`);
        
        if (!response.ok) {
            throw new RecipeError("Failed to load recipe. Please check the URL and try again.");
        }
        
        const data = await response.json();
        
        if (!data || !data.title) {
            throw new RecipeError("Invalid recipe data received. Please try again.");
        }

        const title = data.title;
        const ingredientsList = data.extendedIngredients.map(ingredient => ingredient.original);
        const instructions = data.instructions;
        const imageUrl = data.image;
        const recipeId = data.id;
        
        // Parse instructions into steps
        function parseInstructions(instructionsText) {
            if (!instructionsText) return [];
            
            var steps = [];
            
            // Check if instructions are in HTML format with list items
            if (instructionsText.includes('<li>') || instructionsText.includes('<ol>')) {
                // Extract text from <li> tags
                var liMatches = instructionsText.match(/<li[^>]*>(.*?)<\/li>/gi);
                if (liMatches && liMatches.length > 0) {
                    steps = liMatches.map(function(li) {
                        var text = li.replace(/<[^>]*>/g, '');
                        text = text.replace(/&nbsp;/g, ' ');
                        text = text.replace(/&amp;/g, '&');
                        return text.trim();
                    }).filter(function(step) {
                        return step.length > 0;
                    });
                }
            }
            
            // If no HTML list items found, try other methods
            if (steps.length === 0) {
                var text = instructionsText.replace(/<[^>]*>/g, '');
                text = text.replace(/&nbsp;/g, ' ');
                text = text.replace(/&amp;/g, '&');
                
                // Try splitting by numbered patterns (1., 2., etc.)
                var numberedSteps = text.split(/(?=\d+\.\s)/);
                if (numberedSteps.length > 1) {
                    steps = numberedSteps.map(function(step) {
                        step = step.replace(/^\d+\.\s*/, '');
                        return step.trim();
                    }).filter(function(step) {
                        return step.length > 0;
                    });
                }
                
                // If still no steps, try splitting by line breaks
                if (steps.length <= 1) {
                    steps = text.split(/\n+/).map(function(step) {
                        step = step.replace(/^\d+\.\s*/, '');
                        return step.trim();
                    }).filter(function(step) {
                        return step.length > 0;
                    });
                }
            }
            
            // If still no steps, treat entire text as one step
            if (steps.length === 0) {
                var text = instructionsText.replace(/<[^>]*>/g, '');
                text = text.replace(/&nbsp;/g, ' ');
                text = text.replace(/&amp;/g, '&');
                steps = [text.trim()];
            }
            
            return steps;
        }
        
        const instructionSteps = parseInstructions(instructions);

        let nutritionHTML = '';
        try {
            const nutritionResponse = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/nutritionLabel.json?apiKey=${apiKey}`);
            const nutritionData = await nutritionResponse.json();
            
            let calories = 'N/A';
            let protein = 'N/A';
            let fat = 'N/A';
            let carbs = 'N/A';
            
            if (nutritionData.nutrients && Array.isArray(nutritionData.nutrients)) {
                nutritionData.nutrients.forEach(nutrient => {
                    const name = nutrient.name ? nutrient.name.toLowerCase() : '';
                    const amount = Math.round(nutrient.amount);
                    
                    if (name.includes('calorie')) {
                        calories = amount;
                    } else if (name.includes('protein')) {
                        protein = amount + 'g';
                    } else if (name.includes('fat') && !name.includes('saturated')) {
                        fat = amount + 'g';
                    } else if (name.includes('carbohydrate') || name.includes('carb')) {
                        carbs = amount + 'g';
                    }
                });
            }
            
            if (calories === 'N/A' && nutritionData.calories) {
                calories = Math.round(nutritionData.calories);
            }
            if (protein === 'N/A' && nutritionData.protein) {
                protein = Math.round(nutritionData.protein) + 'g';
            }
            if (fat === 'N/A' && nutritionData.fat) {
                fat = Math.round(nutritionData.fat) + 'g';
            }
            if (carbs === 'N/A' && nutritionData.carbs) {
                carbs = Math.round(nutritionData.carbs) + 'g';
            }
            
            if (calories !== 'N/A') {
                nutritionHTML = `
                    <div class="nutritionwrapper">
                        <h2 class="nutrition-title">Nutrition</h2>
                        <div class="nutrition-card">
                            <div class="nutrition-grid">
                                <div class="nutrition-item">
                                    <span class="nutrition-label">Calories</span>
                                    <span class="nutrition-value">${calories}</span>
                                </div>
                                <div class="nutrition-item">
                                    <span class="nutrition-label">Protein</span>
                                    <span class="nutrition-value">${protein}</span>
                                </div>
                                <div class="nutrition-item">
                                    <span class="nutrition-label">Carbs</span>
                                    <span class="nutrition-value">${carbs}</span>
                                </div>
                                <div class="nutrition-item">
                                    <span class="nutrition-label">Fat</span>
                                    <span class="nutrition-value">${fat}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (nutritionError) {
            console.error('Error fetching nutrition data:', nutritionError);
            try {
                const altResponse = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}&includeNutrition=true`);
                const altData = await altResponse.json();
                
                if (altData.nutrition && altData.nutrition.nutrients) {
                    let calories = 'N/A';
                    let protein = 'N/A';
                    let fat = 'N/A';
                    let carbs = 'N/A';
                    
                    altData.nutrition.nutrients.forEach(nutrient => {
                        const name = nutrient.name ? nutrient.name.toLowerCase() : '';
                        const amount = Math.round(nutrient.amount);
                        
                        if (name.includes('calorie')) {
                            calories = amount;
                        } else if (name.includes('protein')) {
                            protein = amount + 'g';
                        } else if (name.includes('fat') && !name.includes('saturated')) {
                            fat = amount + 'g';
                        } else if (name.includes('carbohydrate') || name.includes('carb')) {
                            carbs = amount + 'g';
                        }
                    });
                    
                    if (calories !== 'N/A') {
                        nutritionHTML = `
                            <div class="nutritionwrapper">
                                <h2 class="nutrition-title">Nutrition</h2>
                                <div class="nutrition-card">
                                    <div class="nutrition-grid">
                                    <div class="nutrition-item">
                                        <span class="nutrition-label">Calories</span>
                                        <span class="nutrition-value">${calories}</span>
                                    </div>
                                    <div class="nutrition-item">
                                        <span class="nutrition-label">Protein</span>
                                        <span class="nutrition-value">${protein}</span>
                                    </div>
                                    <div class="nutrition-item">
                                        <span class="nutrition-label">Carbs</span>
                                        <span class="nutrition-value">${carbs}</span>
                                    </div>
                                    <div class="nutrition-item">
                                        <span class="nutrition-label">Fat</span>
                                        <span class="nutrition-value">${fat}</span>
                                    </div>
                                </div>
                                </div>
                            </div>
                        `;
                    }
                }
            } catch (altError) {
                console.error('Error fetching alternative nutrition data:', altError);
            }
        }

        const recipeDetailsHTML = `
            <div id="chosenrecipe">
            <div class="recipetopwrapper">
                <div class="recpageimgwrapper">
                    <img class="recimg" src="${imageUrl}" alt="${title}" style="max-width: 100%;">
                </div>
                <div class="recpagetitlewrapper">
                <h1 id="maintitle">${title}</h1>
                </div>
            </div> 
                <div class="ingredients-nutrition-wrapper">
                    <div class="ingredientswrapper">
                        <h2 class="ingredients-title">Ingredients</h2>
                        <div class="ingredients-grid">
                            ${ingredientsList.map(function(ingredient, index) {
                                return `
                                    <div class="ingredient-item">
                                        <input type="checkbox" class="ingredient-checkbox" id="ingredient-${index}">
                                        <label for="ingredient-${index}" class="ingredient-label">${ingredient}</label>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    ${nutritionHTML}
                </div>
                <br>
                <div class="instructionswrapper">
                    <h2 class="instructions-title"><span class="title-black">Cooking</span> <span class="title-orange">Instructions</span></h2>
                    <div class="instructions-steps">
                        ${instructionSteps.map(function(step, index) {
                            var stepNumber = (index + 1).toString().padStart(2, '0');
                            return `
                                <div class="instruction-step">
                                    <span class="step-number">${stepNumber}</span>
                                    <p class="step-text">${step}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;

        document.getElementById('recipeDetails').innerHTML = recipeDetailsHTML;
        displaySimilarRecipes(recipeId);

    } catch (error) {
        if (error instanceof RecipeError) {
            showRecipeError(error.message);
        } else if (error.name === "TypeError" && error.message.includes("fetch")) {
            showRecipeError("Network error. Please check your internet connection and try again.");
        } else {
            showRecipeError("An unexpected error occurred. Please try again later.");
        }
        console.error("Recipe extraction error:", error);
    }
}

window.onload = extractRecipeDetails;

async function displaySimilarRecipes(recipeId) {
    try {
        if (!recipeId) {
            throw new RecipeError("No recipe ID available");
        }
        
        const apiKey = '075b51dbcd4d4419836f94c406a94c50';

        const response = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/similar?apiKey=${apiKey}&number=3`);
        
        if (!response.ok) {
            throw new RecipeError("Failed to load similar recipes");
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            throw new RecipeError("Invalid data received for similar recipes");
        }

        const similarRecipesHTML = data.map(recipe => {
            const imageUrl = `https://spoonacular.com/recipeImages/${recipe.id}-480x360.${recipe.imageType}`;
            
            return `
                <div class="cardwrappersugg">
                    <div class="imagewrapper"> 
                        <img src="${imageUrl}" alt="${recipe.title}">
                    </div>

                    <div class="textwrapper"> 
                        <div class="recipetitlewrapper">
                            <p id="recipetitle">${recipe.title}</p>
                        </div>

                        <div class="recipetimewrapper">
                            <div class="icon-wrapper">
                                <img src="images/icons8-clock-50.png" alt="Clock Icon" class="clockicon">
                            </div>
                            <p>Ready in ${recipe.readyInMinutes} minutes</p>
                        </div>

                        <div class="recipeurlwrapper">
                        <a href="recipepagetester.html?recipeUrl=${encodeURIComponent(recipe.sourceUrl)}" class="button" target="_blank">View Recipe</a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('similarRecipes').innerHTML = similarRecipesHTML;
    } catch (error) {
        console.error("Error loading similar recipes:", error);
        var similarRecipesDiv = document.getElementById('similarRecipes');
        if (similarRecipesDiv) {
            similarRecipesDiv.innerHTML = "<p style='text-align: center; color: #666;'>Unable to load similar recipes at this time.</p>";
        }
    }
}


