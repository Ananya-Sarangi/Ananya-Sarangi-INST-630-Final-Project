// Carousel functionality removed - only search bar remains






// Custom error class for API errors
function APIError(message) {
    this.name = "APIError";
    this.message = message || "An error occurred with the API";
}
APIError.prototype = Object.create(Error.prototype);
APIError.prototype.constructor = APIError;

// Show error messages to user
function showErrorToUser(message) {
    var existingError = document.getElementById("errorMessage");
    if (existingError) {
        existingError.remove();
    }
    
    var errorDiv = document.createElement("div");
    errorDiv.id = "errorMessage";
    errorDiv.style.cssText = "background-color: #ff6b6b; color: white; padding: 15px; margin: 20px; border-radius: 5px; text-align: center;";
    errorDiv.textContent = message;
    
    var body = document.body;
    if (body.firstChild) {
        body.insertBefore(errorDiv, body.firstChild);
    } else {
        body.appendChild(errorDiv);
    }
    
    setTimeout(function() {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Recipe class
function Recipe(data) {
    this.title = data.title || "Unknown Recipe";
    this.image = data.image || "";
    this.readyInMinutes = data.readyInMinutes || 0;
    this.sourceUrl = data.sourceUrl || null;
    this.calories = data.calories || null;
}

Recipe.prototype.getIsQuickMeal = function() {
    return this.readyInMinutes > 0 && this.readyInMinutes < 30;
};

Recipe.prototype.toPlainObject = function() {
    return {
        title: this.title,
        image: this.image,
        readyInMinutes: this.readyInMinutes,
        sourceUrl: this.sourceUrl,
        calories: this.calories
    };
};

//recipe data array
var recipesData = [];

// Favorites system
function getFavorites() {
    var favoritesJson = localStorage.getItem("favorites");
    if (favoritesJson) {
        return JSON.parse(favoritesJson);
    }
    return [];
}

function saveFavorites(favorites) {
    localStorage.setItem("favorites", JSON.stringify(favorites));
}

function isFavorited(sourceUrl) {
    if (!sourceUrl) return false;
    var favorites = getFavorites();
    for (var i = 0; i < favorites.length; i++) {
        if (favorites[i].sourceUrl === sourceUrl) {
            return true;
        }
    }
    return false;
}

function toggleFavorite(recipe) {
    if (!recipe.sourceUrl) return;
    
    var favorites = getFavorites();
    var found = false;
    var index = -1;
    
    // Check if recipe is already favorited
    for (var i = 0; i < favorites.length; i++) {
        if (favorites[i].sourceUrl === recipe.sourceUrl) {
            found = true;
            index = i;
            break;
        }
    }
    
    // Add or remove from favorites
    if (found) {
        favorites.splice(index, 1);
    } else {
        favorites.push({
            title: recipe.title,
            image: recipe.image,
            readyInMinutes: recipe.readyInMinutes || 0,
            sourceUrl: recipe.sourceUrl,
            calories: recipe.calories || null
        });
    }
    
    saveFavorites(favorites);
    displayRecipes(recipesData);
}

// Display favorited recipes
function displayFavorites() {
    var favorites = getFavorites();
    
    if (favorites.length === 0) {
        var outputDiv = document.getElementById("recipearea");
        outputDiv.innerHTML = '<p style="text-align: center; padding: 40px; font-size: 18px; color: #666;">No favorites yet. Start favoriting recipes to see them here!</p>';
        var controlsContainer = document.getElementById("controlsContainer");
        if (controlsContainer) {
            controlsContainer.classList.remove("show");
        }
        var randomButton = document.getElementById("randomRecipeButton");
        if (randomButton) {
            randomButton.style.display = "none";
        }
        return;
    }
    
    var randomButton = document.getElementById("randomRecipeButton");
    if (randomButton) {
        randomButton.style.display = "none";
    }
    
    recipesData = favorites;
    displayRecipes(favorites);
}

//make recipe card html
function createRecipeCard(recipe) {
    var {title, image, sourceUrl, readyInMinutes} = recipe;
    var cardHTML = '<div class="cardwrapper" data-source-url="' + (sourceUrl || '') + '">';
    cardHTML += '<div class="imagewrapper">';
    cardHTML += '<img src="' + image + '" alt="' + title + '">';
    var favoriteClass = isFavorited(sourceUrl) ? 'favorited' : '';
    var heartIcon = isFavorited(sourceUrl) ? 'images/heartfilled.png' : 'images/heartempty.png';
    cardHTML += '<button class="favorite-btn ' + favoriteClass + '" data-source-url="' + (sourceUrl || '') + '" style="background-image: url(\'' + heartIcon + '\');">';
    cardHTML += '</button>';
    cardHTML += '</div>';
    cardHTML += '<div class="textwrapper">';
    cardHTML += '<div class="recipetitlewrapper">';
    cardHTML += '<p id="recipetitle">' + title + '</p>';
    cardHTML += '</div>';
    cardHTML += '<div class="recipetimewrapper">';
    cardHTML += '<div class="icon-wrapper">';
    cardHTML += '<img src="images/icons8-clock-50.png" alt="Clock Icon" class="clockicon">';
    cardHTML += '</div>';
    var timeText = (readyInMinutes && readyInMinutes > 0) 
        ? 'Ready in ' + readyInMinutes + ' minutes' 
        : 'Time not available';
    cardHTML += '<p>' + timeText + '</p>';
    cardHTML += '</div>';
    cardHTML += '<div class="recipeurlwrapper">';
    if (sourceUrl) {
        cardHTML += '<a href="recipepagetester.html?recipeUrl=' + encodeURIComponent(sourceUrl) + '" class="button" target="_blank">View Recipe</a>';
    } else {
        cardHTML += '<span class="button" style="opacity: 0.5; cursor: not-allowed;">Recipe details unavailable</span>';
    }
    cardHTML += '</div>';
    cardHTML += '</div>';
    cardHTML += '</div>';
    return cardHTML;
}

//show recipe cards
function displayRecipes(recipes) {
    var controlsContainer = document.getElementById("controlsContainer");
    if (controlsContainer && recipes.length > 0) {
        controlsContainer.classList.add("show");
    }
    
    var randomButton = document.getElementById("randomRecipeButton");
    if (randomButton) {
        if (isViewingFavorites) {
            randomButton.style.display = "none";
        } else {
            randomButton.style.display = "block";
        }
    }
    
    var outputDiv = document.getElementById("recipearea");
    outputDiv.innerHTML = '';

    for (var i = 0; i < recipes.length; i++) {
        var recipeCard = createRecipeCard(recipes[i]);
        outputDiv.innerHTML += recipeCard;
    }
    
    var favoriteButtons = outputDiv.querySelectorAll('.favorite-btn');
    for (var j = 0; j < favoriteButtons.length; j++) {
        favoriteButtons[j].addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var sourceUrl = this.getAttribute('data-source-url');
            for (var k = 0; k < recipesData.length; k++) {
                if (recipesData[k].sourceUrl === sourceUrl) {
                    toggleFavorite(recipesData[k]);
                    break;
                }
            }
        });
    }
    
    scrollToResultSection();
}

// Advanced filtering
function applyFilters() {
    if (!recipesData || recipesData.length === 0) {
        return;
    }
    
    var maxTime = document.getElementById("maxTimeFilter").value;
    
    if (maxTime && maxTime !== "") {
        if (!validateNumberInput(maxTime)) {
            showErrorToUser("Please enter a valid number for max cooking time.");
            return;
        }
    }
    
    var filteredRecipes = recipesData.filter(function(recipe) {
        if (maxTime && maxTime !== "") {
            var recipeTime = recipe.readyInMinutes || 0;
            if (recipeTime > parseInt(maxTime)) {
                return false;
            }
        }
        return true;
    });
    
    displayRecipes(filteredRecipes);
}

function clearFilters() {
    document.getElementById("maxTimeFilter").value = "";
    displayRecipes(recipesData);
}

//sort recipes function
function sortRecipes(sortOption) {
    if (!recipesData || recipesData.length === 0) {
        return;
    }
    
    var sortedRecipes = recipesData.slice(); // Create a copy to avoid mutating original
    
    switch(sortOption) {
        case 'time-asc':
            sortedRecipes.sort(function(a, b) {
                return (a.readyInMinutes || 0) - (b.readyInMinutes || 0);
            });
            break;
        case 'time-desc':
            sortedRecipes.sort(function(a, b) {
                return (b.readyInMinutes || 0) - (a.readyInMinutes || 0);
            });
            break;
        case 'calories-asc':
            sortedRecipes.sort(function(a, b) {
                var caloriesA = a.calories !== null && a.calories !== undefined ? a.calories : Infinity;
                var caloriesB = b.calories !== null && b.calories !== undefined ? b.calories : Infinity;
                // Put recipes without calories at the end
                if (caloriesA === Infinity && caloriesB === Infinity) return 0;
                if (caloriesA === Infinity) return 1;
                if (caloriesB === Infinity) return -1;
                return caloriesA - caloriesB;
            });
            break;
        case 'calories-desc':
            sortedRecipes.sort(function(a, b) {
                var caloriesA = a.calories !== null && a.calories !== undefined ? a.calories : -1;
                var caloriesB = b.calories !== null && b.calories !== undefined ? b.calories : -1;
                // Put recipes without calories at the end
                if (caloriesA === -1 && caloriesB === -1) return 0;
                if (caloriesA === -1) return 1;
                if (caloriesB === -1) return -1;
                return caloriesB - caloriesA;
            });
            break;
        case 'title-asc':
            sortedRecipes.sort(function(a, b) {
                var titleA = (a.title || '').toLowerCase();
                var titleB = (b.title || '').toLowerCase();
                if (titleA < titleB) return -1;
                if (titleA > titleB) return 1;
                return 0;
            });
            break;
        case 'title-desc':
            sortedRecipes.sort(function(a, b) {
                var titleA = (a.title || '').toLowerCase();
                var titleB = (b.title || '').toLowerCase();
                if (titleA > titleB) return -1;
                if (titleA < titleB) return 1;
                return 0;
            });
            break;
        case 'none':
        default:
            // No sorting, use original order
            break;
    }
    
    displayRecipes(sortedRecipes);
}

//sort dropdown event listener
document.addEventListener('DOMContentLoaded', function() {
    var sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortRecipes(this.value);
        });
    }
});

//get random recipe
function getRandomRecipe() {
    var apiKey = "075b51dbcd4d4419836f94c406a94c50";
    var apiUrl = "https://api.spoonacular.com/recipes/random?apiKey=" + apiKey + "&number=1&includeNutrition=true";
    
    var randomButton = document.getElementById("randomRecipeButton");
    if (randomButton) {
        randomButton.disabled = true;
        randomButton.textContent = "Finding a recipe...";
    }
    
    try {
    $.ajax({
        url: apiUrl,
        success: function (res) {
                try {
                    // Validate the response
                    if (!res || !res.recipes || res.recipes.length === 0) {
                        throw new APIError("No random recipe found. Please try again.");
                    }
                    
                var recipe = res.recipes[0];
                
                // Get calories from nutrition data
                var calories = null;
                if (recipe.nutrition && recipe.nutrition.nutrients) {
                    for (var i = 0; i < recipe.nutrition.nutrients.length; i++) {
                        if (recipe.nutrition.nutrients[i].name === "Calories") {
                            calories = Math.round(recipe.nutrition.nutrients[i].amount);
                            break;
                        }
                    }
                }
                
                    var recipeInstance = new Recipe({
                    title: recipe.title,
                    image: recipe.image,
                    readyInMinutes: recipe.readyInMinutes || 0,
                    sourceUrl: recipe.sourceUrl,
                    calories: calories
                    });
                    
                    isViewingFavorites = false;
                    recipesData = [recipeInstance];
                    displayRecipes([recipeInstance.toPlainObject()]);
                } catch (error) {
                    // Handle errors in the success callback
                    if (error instanceof APIError) {
                        showErrorToUser(error.message);
                    } else {
                        showErrorToUser("Failed to process recipe data.");
                    }
                } finally {
            if (randomButton) {
                randomButton.disabled = false;
                randomButton.textContent = "Confused what to make? Show me a random recipe";
                    }
                }
            },
            error: function(xhr, status, error) {
                var errorMessage = "Failed to fetch random recipe. ";
                if (xhr.status === 0) {
                    errorMessage += "Please check your internet connection.";
                } else if (xhr.status === 429) {
                    errorMessage += "Too many requests. Please wait a moment.";
                } else {
                    errorMessage += "Please try again later.";
                }
                showErrorToUser(errorMessage);
            }
        });
    } catch (error) {
        if (error instanceof APIError) {
            showErrorToUser(error.message);
        } else {
            showErrorToUser("An unexpected error occurred.");
        }
    } finally {
            if (randomButton) {
                randomButton.disabled = false;
                randomButton.textContent = "Confused what to make? Show me a random recipe";
            }
        }
}

//random recipe button event listener
document.addEventListener('DOMContentLoaded', function() {
    var randomButton = document.getElementById("randomRecipeButton");
    if (randomButton) {
        randomButton.addEventListener('click', getRandomRecipe);
    }
});


//scroll to results
function scrollToResultSection() {
    var resultSection = document.getElementById("3");
    if (resultSection) {
        resultSection.scrollIntoView({ behavior: "smooth" });
    }
}

// Input validation with regex
function validateSearchQuery(query) {
    if (!query || query.trim() === "") {
        return false;
    }
    // Allow letters, numbers, spaces, and common punctuation
    var searchPattern = /^[a-zA-Z0-9\s\-',.]+$/;
    return searchPattern.test(query.trim());
}

function validateNumberInput(value) {
    if (!value || value === "") {
        return true; // Empty is OK
    }
    // Must be a positive number
    var numberPattern = /^\d+$/;
    return numberPattern.test(value);
}

//get recipes from api - search
function getRecipesFromAPI(query) {
    try {
        if (!query || query.trim() === "") {
            throw new APIError("Please enter a search term");
        }
        
        if (!validateSearchQuery(query)) {
            throw new APIError("Search query contains invalid characters. Please use only letters, numbers, and spaces.");
        }
        
    var apiKey = "075b51dbcd4d4419836f94c406a94c50";
    var apiUrl = "https://api.spoonacular.com/recipes/search?apiKey=" + apiKey + "&number=15&query=" + query;
    
    $.ajax({
        url: apiUrl,
        success: function (res) {
                if (!res || !res.results) {
                    throw new APIError("No recipes found. Please try a different search.");
                }
                
            var recipes = [];
            for (var i = 0; i < res.results.length; i++) {
                    var result = res.results[i];
                    var {title, image, readyInMinutes, sourceUrl} = result;
                recipes.push({
                        title: title,
                        image: res.baseUri + image,
                        readyInMinutes: readyInMinutes,
                        sourceUrl: sourceUrl
                });
            }
            
            isViewingFavorites = false;
            recipesData = recipes;
            displayRecipes(recipesData);
            },
            error: function(xhr, status, error) {
                var errorMessage = "Failed to search recipes. ";
                if (xhr.status === 0) {
                    errorMessage += "Please check your internet connection.";
                } else if (xhr.status === 429) {
                    errorMessage += "Too many requests. Please wait a moment.";
                } else {
                    errorMessage += "Please try again later.";
                }
                showErrorToUser(errorMessage);
            }
        });
    } catch (error) {
        if (error instanceof APIError) {
            showErrorToUser(error.message);
        } else {
            showErrorToUser("An unexpected error occurred. Please try again.");
        }
    }
}

//get recipes by cuisine
// Added error handling here too
function getCuisinesFromAPI(query) {
    try {
        if (!query || query.trim() === "") {
            throw new APIError("Invalid cuisine selection");
        }
        
    var apiKey = "075b51dbcd4d4419836f94c406a94c50";
    var apiUrl = "https://api.spoonacular.com/recipes/search?apiKey=" + apiKey + "&number=15&query=" + query;
    
    $.ajax({
        url: apiUrl,
        success: function (res) {
                if (!res || !res.results) {
                    throw new APIError("No recipes found for this cuisine.");
                }
                
            var recipes = [];
            for (var i = 0; i < res.results.length; i++) {
                var result = res.results[i];
                recipes.push({
                    title: result.title,
                    image: res.baseUri + result.image,
                    readyInMinutes: result.readyInMinutes,
                    sourceUrl: result.sourceUrl
                });
            }
            
                isViewingFavorites = false;
                recipesData = recipes;
                displayRecipes(recipesData);
            },
            error: function(xhr, status, error) {
                var errorMessage = "Failed to load recipes. ";
                if (xhr.status === 0) {
                    errorMessage += "Please check your internet connection.";
                } else {
                    errorMessage += "Please try again later.";
                }
                showErrorToUser(errorMessage);
            }
        });
    } catch (error) {
        if (error instanceof APIError) {
            showErrorToUser(error.message);
        } else {
            showErrorToUser("An error occurred while loading cuisine recipes.");
        }
    }
}

//search box
document.getElementById("search").addEventListener("keypress", function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        var query = document.getElementById("search").value;
        getRecipesFromAPI(query);
    }
});

//search button
var searchButton = document.querySelector(".search-button");
if (searchButton) {
    searchButton.addEventListener("click", function() {
        var query = document.getElementById("search").value;
        getRecipesFromAPI(query);
    });
}




//map click - cuisine search
var svgContainer = document.getElementById("svgContainer");
var svgGroups = svgContainer.querySelectorAll("g");

for (var i = 0; i < svgGroups.length; i++) {
    svgGroups[i].addEventListener("click", function() {
        var cuisineType = this.getAttribute("data-cuisine");
        getCuisinesFromAPI(cuisineType);
    });
}





//get recipes by calories
function getRecipesByMaxCalories(maxCalories) {
    try {
        if (!maxCalories || isNaN(maxCalories) || maxCalories <= 0) {
            throw new APIError("Please enter a valid calorie amount");
        }
        
        var outputDiv = document.getElementById("recipearea");
        if (outputDiv) {
            outputDiv.innerHTML = '<p style="text-align: center; padding: 20px;">Loading recipes...</p>';
        }
        
    var apiKey = "075b51dbcd4d4419836f94c406a94c50";
    var url = "https://api.spoonacular.com/recipes/findByNutrients?maxCalories=" + maxCalories + "&apiKey=" + apiKey;
  
    fetch(url)
      .then(function(response) {
              if (!response.ok) {
                  throw new APIError("Failed to fetch recipes. Please try again.");
              }
          return response.json();
      })
      .then(function(data) {
              if (!Array.isArray(data)) {
                  throw new APIError("No recipes found for this calorie range.");
              }
              
              // Fetch full recipe details to get readyInMinutes and sourceUrl
              var recipePromises = data.map(function(recipe) {
                  var recipeId = recipe.id;
                  var recipeInfoUrl = "https://api.spoonacular.com/recipes/" + recipeId + "/information?apiKey=" + apiKey;
                  
                  return fetch(recipeInfoUrl)
                      .then(function(response) {
                          if (!response.ok) {
                              return {
                                  title: recipe.title,
                                  image: recipe.image,
                                  readyInMinutes: 0,
                                  sourceUrl: null,
                                  calories: recipe.calories || null,
                                  id: recipeId
                              };
                          }
                          return response.json();
                      })
                      .then(function(recipeInfo) {
                          return {
                              title: recipeInfo.title || recipe.title,
                              image: recipeInfo.image || recipe.image,
                              readyInMinutes: recipeInfo.readyInMinutes || 0,
                              sourceUrl: recipeInfo.sourceUrl || recipeInfo.spoonacularSourceUrl || null,
                              calories: recipe.calories || null,
                              id: recipeId
                          };
                      })
                      .catch(function(error) {
                          return {
                              title: recipe.title,
                              image: recipe.image,
                              readyInMinutes: 0,
                              sourceUrl: null,
                              calories: recipe.calories || null,
                              id: recipeId
                          };
                      });
              });
              
              Promise.all(recipePromises)
                  .then(function(recipes) {
                      var validRecipes = recipes.filter(function(recipe) {
                          return recipe.sourceUrl !== null && recipe.sourceUrl !== undefined;
                      });
                      
                      if (validRecipes.length === 0) {
                          showErrorToUser("No recipes with full details found. Please try a different calorie range.");
                          if (outputDiv) {
                              outputDiv.innerHTML = '';
                          }
                      } else {
                          isViewingFavorites = false;
                          recipesData = validRecipes;
          displayRecipes(recipesData);
                      }
                  })
                  .catch(function(error) {
                      showErrorToUser("Failed to load recipe details. Please try again.");
                      if (outputDiv) {
                          outputDiv.innerHTML = '';
                      }
                  });
      })
      .catch(function(error) {
              if (error instanceof APIError) {
                  showErrorToUser(error.message);
              } else {
                  showErrorToUser("Failed to load recipes by calories. Please check your connection and try again.");
              }
              if (outputDiv) {
                  outputDiv.innerHTML = '';
              }
          });
    } catch (error) {
        if (error instanceof APIError) {
            showErrorToUser(error.message);
        } else {
            showErrorToUser("An unexpected error occurred.");
        }
    }
}
 
//calories button
document.getElementById("maxButton").addEventListener("click", function () {
    var maxCalories = document.getElementById("maxCaloriesSlider").value;
    getRecipesByMaxCalories(maxCalories);
});

//update calories number
var slider = document.getElementById("maxCaloriesSlider");
var caloriesValue = document.getElementById("caloriesValue");

function updateCaloriesValue() {
    caloriesValue.textContent = slider.value;
}

slider.addEventListener("input", updateCaloriesValue);
updateCaloriesValue();

// View favorites button and filter buttons
document.addEventListener('DOMContentLoaded', function() {
    var viewFavoritesBtn = document.getElementById("viewFavoritesBtn");
    if (viewFavoritesBtn) {
        viewFavoritesBtn.addEventListener('click', function() {
            displayFavorites();
            scrollToResultSection();
        });
    }
    
    var applyFiltersBtn = document.getElementById("applyFiltersBtn");
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            applyFilters();
        });
    }
    
    var clearFiltersBtn = document.getElementById("clearFiltersBtn");
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            clearFilters();
        });
    }

    // Ingredients search functionality
    var selectedIngredientsList = [];
    
    // Ingredient tag click handler
    var ingredientTags = document.querySelectorAll('.ingredient-tag');
    for (var i = 0; i < ingredientTags.length; i++) {
        ingredientTags[i].addEventListener('click', function() {
            var ingredient = this.getAttribute('data-ingredient');
            toggleIngredient(ingredient);
        });
    }
    
    // Add custom ingredient
    var addIngredientBtn = document.getElementById('addIngredientBtn');
    if (addIngredientBtn) {
        addIngredientBtn.addEventListener('click', function() {
            var customInput = document.getElementById('customIngredient');
            var ingredient = customInput.value.trim().toLowerCase();
            if (ingredient && !selectedIngredientsList.includes(ingredient)) {
                selectedIngredientsList.push(ingredient);
                updateSelectedIngredients();
                customInput.value = '';
            }
        });
    }
    
    // Enter key for custom ingredient
    var customIngredient = document.getElementById('customIngredient');
    if (customIngredient) {
        customIngredient.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addIngredientBtn.click();
            }
        });
    }
    
    // Search by ingredients button
    var searchByIngredientsBtn = document.getElementById('searchByIngredientsBtn');
    if (searchByIngredientsBtn) {
        searchByIngredientsBtn.addEventListener('click', function() {
            if (selectedIngredientsList.length > 0) {
                getRecipesByIngredients(selectedIngredientsList);
            }
        });
    }
    
    function toggleIngredient(ingredient) {
        var index = selectedIngredientsList.indexOf(ingredient);
        if (index > -1) {
            selectedIngredientsList.splice(index, 1);
        } else {
            selectedIngredientsList.push(ingredient);
        }
        updateSelectedIngredients();
    }
    
    function updateSelectedIngredients() {
        var selectedTagsDiv = document.getElementById('selectedTags');
        if (!selectedTagsDiv) return;
        
        selectedTagsDiv.innerHTML = '';
        
        for (var i = 0; i < selectedIngredientsList.length; i++) {
            var ingredient = selectedIngredientsList[i];
            var tag = document.createElement('div');
            tag.className = 'selected-ingredient-tag';
            tag.innerHTML = ingredient + '<button class="remove-ingredient" data-ingredient="' + ingredient + '">×</button>';
            selectedTagsDiv.appendChild(tag);
        }
        
        // Update tag visual states - disable selected ones
        var allTags = document.querySelectorAll('.ingredient-tag');
        for (var j = 0; j < allTags.length; j++) {
            var tagIngredient = allTags[j].getAttribute('data-ingredient');
            if (selectedIngredientsList.includes(tagIngredient)) {
                allTags[j].disabled = true;
                allTags[j].classList.remove('selected');
            } else {
                allTags[j].disabled = false;
                allTags[j].classList.remove('selected');
            }
        }
        
        // Update search button state
        if (searchByIngredientsBtn) {
            searchByIngredientsBtn.disabled = selectedIngredientsList.length === 0;
        }
        
        // Add remove handlers
        var removeButtons = document.querySelectorAll('.remove-ingredient');
        for (var k = 0; k < removeButtons.length; k++) {
            removeButtons[k].addEventListener('click', function() {
                var ingredientToRemove = this.getAttribute('data-ingredient');
                var index = selectedIngredientsList.indexOf(ingredientToRemove);
                if (index > -1) {
                    selectedIngredientsList.splice(index, 1);
                    updateSelectedIngredients();
                }
            });
        }
    }
    
    function getRecipesByIngredients(ingredients) {
        try {
            if (!ingredients || ingredients.length === 0) {
                throw new APIError("Please select at least one ingredient");
            }
            
            var outputDiv = document.getElementById("recipearea");
            if (outputDiv) {
                outputDiv.innerHTML = '<p style="text-align: center; padding: 20px;">Loading recipes...</p>';
            }
            
            var apiKey = "075b51dbcd4d4419836f94c406a94c50";
            var ingredientsString = ingredients.join(',');
            var url = "https://api.spoonacular.com/recipes/findByIngredients?ingredients=" + encodeURIComponent(ingredientsString) + "&number=15&apiKey=" + apiKey;
            
            fetch(url)
                .then(function(response) {
                    if (!response.ok) {
                        throw new APIError("Failed to fetch recipes. Please try again.");
                    }
                    return response.json();
                })
                .then(function(data) {
                    if (!Array.isArray(data) || data.length === 0) {
                        throw new APIError("No recipes found with these ingredients.");
                    }
                    
                    var recipes = [];
                    var recipePromises = [];
                    
                    for (var i = 0; i < data.length; i++) {
                        var recipeId = data[i].id;
                        var promise = fetch("https://api.spoonacular.com/recipes/" + recipeId + "/information?apiKey=" + apiKey)
                            .then(function(response) {
                                return response.json();
                            })
                            .then(function(recipeData) {
                                return {
                                    title: recipeData.title,
                                    image: recipeData.image,
                                    readyInMinutes: recipeData.readyInMinutes,
                                    sourceUrl: recipeData.sourceUrl,
                                    calories: recipeData.nutrition && recipeData.nutrition.nutrients ? 
                                        recipeData.nutrition.nutrients.find(function(n) { 
                                            return n.name && n.name.toLowerCase().includes('calorie'); 
                                        }) : null
                                };
                            });
                        recipePromises.push(promise);
                    }
                    
                    Promise.all(recipePromises)
                        .then(function(recipeResults) {
                            recipes = recipeResults.filter(function(r) {
                                return r.sourceUrl;
                            });
                            
                            if (recipes.length === 0) {
                                throw new APIError("No recipes with complete information found.");
                            }
                            
                            isViewingFavorites = false;
                            recipesData = recipes;
                            displayRecipes(recipesData);
                        })
                        .catch(function(error) {
                            console.error("Error fetching recipe details:", error);
                            showErrorToUser("Failed to load recipe details. Please try again.");
                        });
                })
                .catch(function(error) {
                    if (error instanceof APIError) {
                        showErrorToUser(error.message);
                    } else {
                        showErrorToUser("An error occurred while searching recipes.");
                    }
                    console.error("Error:", error);
                });
        } catch (error) {
            if (error instanceof APIError) {
                showErrorToUser(error.message);
            } else {
                showErrorToUser("An error occurred while searching recipes.");
            }
        }
    }
    
    // Initialize search button state
    if (searchByIngredientsBtn) {
        searchByIngredientsBtn.disabled = true;
    }
});