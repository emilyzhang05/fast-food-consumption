// Q5: List the average monthly intake by nutrient
db.simulated_food_intake_2015_2020.aggregate([ // using aggregate to provide better structure in constructing queries
  { $group: {
      _id: "$Month", // by month
      avg_animal_protein: { $avg: { $toDouble: "$Daily_calorie_animal_protein" } }, // converting to correct data type to calculate average
      avg_vegetal_protein: { $avg: { $toDouble: "$Daily_calorie_vegetal_protein" } },
      avg_fat: { $avg: { $toDouble: "$Daily_calorie_fat" } },
      avg_carbohydrates: { $avg: { $toDouble: "$Daily_calorie_carbohydrates" } } }
  }
]);



//Q6: finding which month is the peak for each type of nutrient for all the 5 entities.
db.simulated_food_intake_2015_2020.aggregate([
  {
    $addFields: { // converting string fields to numerical form for later when using functions like $max 
      Year: { $toInt: "$Year" },
      Month: { $toInt: "$Month" },
      Daily_calorie_animal_protein: { $toDouble: "$Daily_calorie_animal_protein" },
      Daily_calorie_vegetal_protein: { $toDouble: "$Daily_calorie_vegetal_protein" },
      Daily_calorie_fat: { $toDouble: "$Daily_calorie_fat" },
      Daily_calorie_carbohydrates: { $toDouble: "$Daily_calorie_carbohydrates" }
    }
  },
  {
    $group: { // average nutrient values per country per month
      _id: { Entity: "$Entity", Month: "$Month" },
      avg_fat: { $avg: "$Daily_calorie_fat" },
      avg_animal: { $avg: "$Daily_calorie_animal_protein" },
      avg_vegetal: { $avg: "$Daily_calorie_vegetal_protein" },
      avg_carb: { $avg: "$Daily_calorie_carbohydrates" }
    }
  },
  { // organize by country and month 
    $sort: { "_id.Entity": 1, "_id.Month": 1 }
  },
  {
    $group: { // gather all months into an array per country
      _id: "$_id.Entity",
      months: { $push: { 
        month: "$_id.Month", 
        avg_fat: "$avg_fat",
        avg_animal: "$avg_animal",
        avg_vegetal: "$avg_vegetal",
        avg_carb: "$avg_carb"
      }}
    }
  },
  {
    $project: { // extract the month with the highest avg for each nutrient, done for all 4 nutrients seperately to avoid collapsing 
      peak_month_fat: {
        $arrayElemAt: [
          "$months.month",
          { $indexOfArray: ["$months.avg_fat", { $max: "$months.avg_fat" }] }
        ]
      },
      peak_month_animal: {
        $arrayElemAt: [ // retrieves the month corresponding to that max value 
          "$months.month",
          { $indexOfArray: ["$months.avg_animal", { $max: "$months.avg_animal" }] } // finding index of max in the array and 
        ]
      },
      peak_month_vegetal: {
        $arrayElemAt: [ 
          "$months.month",
          { $indexOfArray: ["$months.avg_vegetal", { $max: "$months.avg_vegetal" }] }
        ]
      },
      peak_month_carb: {
        $arrayElemAt: [
          "$months.month",
          { $indexOfArray: ["$months.avg_carb", { $max: "$months.avg_carb" }] }
        ]
      }
    }
  },
  { $sort: { _id: 1 } } // sort by highest first to find peak month
]);


//Q9: Calculate fat-to-protein ratio (efficiency indicator)
db.mcdonaldata.aggregate([
    {
        $set: {
            totalfat: {$toDouble: "$totalfat"},         // convert string to double for numeric calculations later on
            protien: {$toDouble: "$protien"}
        }
    }, 
    {
        $addFields: {
            fat_to_protein_ratio: {                     // add field: fat_to_protein_ratio
                $cond: { 
                    if: { $eq:["$protien",0] },         // to prevent division by zero
                    then: null, 
                    else: {$divide: ["$totalfat","$protien"]}
                }
            }
        }
    },
    {
        $project:{
            _id: 0,                                     // exclude _id
            item: 1,
            totalfat: 1,
            protien: 1,
            fat_to_protein_ratio: {$round: ["$fat_to_protein_ratio", 2]}    // round off to 2 d.p.
        }
    },
    {$sort: {fat_to_protein_ratio: -1}}                 // sort by fat_to_protein_ratio in descending order
    ]);


//Q10: List items with high sodium + fat + cholesterol
db.mcdonaldata.aggregate([
  {
      $match: {
          calories: {$not: /Â/}     // filter out rows with 'Â' in calories
      }
  }, 
  {
      $set:{
          calories: {$toDouble: "$calories"},       // convert strings to double for numeric calculations
          totalfat: {$toDouble: "$totalfat"},
          cholestrol: {$toDouble: "$cholestrol"},
          sodium: {$toDouble: "$sodium"}
      }
  },
  {
      $addFields: {
          health_flag: {            // add health_flag field
              $cond: {              // condition for health_flag field
                  if: {
                      $or: [
                          {$gt: ["$totalfat", 30]}, 
                          {$gt: ["$sodium", 1000]},
                          {$gt: ["$cholestrol", 30]}
                        ]
                    },
                then: "⚠ High Risk",
                else: "✓ Moderate"
            }
        }
    }
  },
  {
    $project: {
        _id: 0,             // exclude _id
        item: 1,
        calories: 1,
        totalfat: 1,
        cholestrol: 1,
        sodium: 1,
        health_flag: 1
    }
  },
  {
    $sort: {health_flag:1, calories: -1}        // order by health_flag, calories desc 
  }
    
]);


//Q11: Which Categories Are Most Weight Watchers-Friendly?
db.burger_king_menu.aggregate([
    {$set: {Weight_Watchers: {$toDouble: "$Weight_Watchers" }}}, 
    //updates Weight_Watchers to double (float number) so we can perform numeric operations and get average score
    {$group: {_id:"$Category", Avg_WW_Score: {$avg: "$Weight_Watchers"}}}, 
    //group the documents by category and so Avg_WW_Score is calculated per category
    {$sort: {Avg_WW_Score: 1}},
    //sort the Avg_WW_Score in ascending order as per the order shown in the question
    {$project: {Category: "$_id", Avg_WW_Score: {$round: ["$Avg_WW_Score", 2]}, _id:0}}
    //extract Category values embedded in _id
    //round Avg_WW_Score to 2 decimal places
    //exclusion clause because we don't want _id
])


//Q12: List the top 10 most caloric menu items.
db.burger_king_menu.aggregate([
    {$sort: {Calories: -1}}, //question asked for most caloric items so sort in descending order so items with highest calories are moved to the top
    {$limit: 10}, //question asked for top 10, so limit list of items to most caloric 10 items
    {$project: {Item: 1, Category: 1, Calories: 1}} //extract Item, Category and Calories values embedded in _id
])


//Q13 :Bakery vs. Non-Bakery: Nutrition contrast
db.starbucks.aggregate([
    {
        $addFields: 
        {
            calories_num: {$toInt: "$calories"}, //convert calories from string to integer
            fat_num: {$toDouble: "$fat" }, //convert fat from string to integer
            protein_num: {$toInt: "$protein"} //convert protein from string to integer
            
        }
    },
    {
        $group: {
            _id: "$type", //group by type
            count_items: {$sum:1}, //count number of items in each type
            avg_calories: {$avg: "$calories_num"}, //average calories for each type
            avg_fat: {$avg: "$fat_num"}, //average fat for each type
            avg_protein: {$avg: "$protein_num"} //average protein for each type
        }
    },
    {
        $project: {
            _id: 0, //to hide the _id field
            type: "$_id", //rename _id to type
            count_items: 1, //include 'count_items' field
            avg_calories: {$round: ["$avg_calories", 0]}, //round of to 0 decimal place
            avg_fat:{$round:["$avg_fat",0]}, //round of to 0 decimal place
            avg_protein: {$round:["$avg_protein",0]} //round of to 0 decimal place
        }
    },
    {
        $sort:{avg_calories: -1} //sort by decreasing average calories
    }
])


//Q14: Compare Each Item to Average Calories in Its Type. Shows how far above or below the average each item is within its group.
db.starbucks.aggregate([
    {
        $addFields: {
            calories_num: {$toInt: "$calories"} //convert calories from string to integer
        }
    },
    {
        $group: {
            _id: "$type", //group by type
            avg_calories: {$avg: "$calories_num"}, //average calories for each type
            items:{  
                $push:{  //collate all items of this type
                    item: "$item",  //store the item name
                    type: "$type",  //store the type 
                    calories: "$calories_num" //store the calories as integers 
                }
            }
        }
    }, 
    {
        $unwind: "$items" // since the collated items were in an array, we need to make them individual documents
    }, 
    {
        $project: {
            _id:0, //to hide the _id field
            item: "$items.item", //include 'item' name
            type: "$items.type", //include 'type'
            calories: "$items.calories", //include 'calories'
            avg_type_calories: {$round:["$avg_calories",0]}, //include 'avg_calories', rounded to 0 decimal place
            delta_from_avg:{
                $round:[
                    {$subtract: ["$items.calories", "$avg_calories"]} //compute difference between calories from avg_calories
                    ]
            }
        }
    },
    {
        $sort: {calories:-1, type:1} //sort by type, in decreasing order of calories
    }
])


//Q16: Do countries with higher average protein/fat intake during winter months tend to report higher happiness?
db.simulated_food_intake_2015_2020.aggregate([
    {$match: {
        Year:"2015",
        $or:[
        { Entity: { $in: ['United States','India','Germany','Japan'] }, Month: { $in: ['12','1','2'] } },
        { Entity: 'Brazil', Month: { $in: ['6','7','8'] } }
    ]}},
    //filter to only winter months
    //Dec to Feb for the countries in the Northern Hemisphere and 
    //Jun to Aug for those in the Southern Hemisphere
    {$lookup: { from: "happiness", localField: "Entity", foreignField: "Country", as: "happiness_data" }},
    //join with happiness collection
    {$unwind: { path: "$happiness_data", preserveNullAndEmptyArrays: true }},
    //convert the joined array to individual documents to get happiness score eventually
    {$set: {
      Daily_calorie_animal_protein: { $toDouble: "$Daily_calorie_animal_protein" },
      Daily_calorie_vegetal_protein: { $toDouble: "$Daily_calorie_vegetal_protein" },
      Daily_calorie_fat: { $toDouble: "$Daily_calorie_fat" }
    }},
    //make any strings numeric to perform aggregation
    {$group: {
      _id: "$Entity",
      avg_protein: { $avg: { $add: ["$Daily_calorie_animal_protein","$Daily_calorie_vegetal_protein"] }},
      avg_fat: { $avg: "$Daily_calorie_fat" },
      happiness_score: { $first: "$happiness_data.Happiness_Score" }
    }},
    //group by countries and obtain the avg_protein, avg_fat and get the happiness score from happiness collection
    { $project: {
      country: "$_id",
      avg_protein: { $round: ["$avg_protein",2] },
      avg_fat: { $round: ["$avg_fat",2] },
      happiness_score: 1,
      _id: 0
    }},
    //extract country, avg_protein, avg_fat, happiness_score and exclude the _id
    {$sort:{ happiness_score: -1 }}
])



//Q17: Do long-term fat intake trends (from 1961–2020) correlate with happiness?
//create a collection to compute and save the average daily fat intake per country
db.daily_intake.aggregate([
    {
        $match: {
            Year: {$gte: "1961", $lte: "2020"} //include data only between these 2 years
        }
    }, 
    {
        $group:{
            _id: "$Entity", //group by country
            avg_fat_intake: {$avg: {$toDouble: "$Daily_calorie_fat"}} //calculate average fat intake per country
        }
    }, 
    {
        $project: {
            country: "$_id", //rename _id to country
            avg_fat_intake: {$round: ["$avg_fat_intake",2]}, //round off avg_fat_intake value to 2 decimal places
            _id:0 //hide the _id field
        }
    }, 
    {
        $out: "avg_fat_by_country" //save the results in the collection
    }
])

//main collection where happiness and average fat intake data is combined
db.happiness.aggregate([
    {
        $lookup: {
               from: "avg_fat_by_country", //combine the results from the previous collection to the new one
               localField: "Country", //field from the 'happiness' dataset
               foreignField: "country", //name of matching field in the 'avg_fat_by_country' collection
               as: "fatdata" //joined results are stored in this new array field
             }
    }, 
    {
        $unwind: "$fatdata" //expands this array to individual documents so that each country takes up one row based on matched records
    }, 
    {
        $project: {
            country: "$Country", //include country name in output
            happiness_score: { $round: [{$toDouble: "$Happiness_Score"},3] },//include happiness score in 3 decimal places in output
            avg_fat_intake: "$fatdata.avg_fat_intake" //include average fat intake per country in output
        }
    }, 
    {
        $sort: {happiness_score: -1} //sort the countries based on decreasing happiness scores
    }, 
    {
        $group: { 
            _id:null, //to combine all the documents to one group
            countries: {$push: "$$ROOT"} //all the documents are pushed to another array called "countries"
        }
    },
    {
        $unwind: {
            path: "$countries", //array is expanded again to individual documents
            includeArrayIndex: "happiness_ranking" // to keep track of each country's happiness index
        }
    },
    {
        $replaceRoot: { 
            newRoot: { 
                happiness_ranking: {$add: ["$happiness_ranking",1]}, // 1 is added so that ranking starts from 1 and not 0
                country: "$countries.country", //include country name in output
                happiness_score: "$countries.happiness_score", //include happiness score per country in output
                avg_fat_intake: "$countries.avg_fat_intake" // include average fat intake per country in output
            }
        }
    },
    {
        $sort: {happiness_ranking: 1} //final sorting done based on happiness ranking
    }
])


//Q18: Are countries with lower monthly nutrient variation happier?
// Analyzes nutrient variation vs happiness

db.daily_intake.aggregate([
  // Convert all non-numerical fields to numbers - using double to get correct precision
  {
    $addFields: {
      animal: { $toDouble: "$Daily_calorie_animal_protein" },
      vegetal: { $toDouble: "$Daily_calorie_vegetal_protein" },
      fat: { $toDouble: "$Daily_calorie_fat" },
      carbs: { $toDouble: "$Daily_calorie_carbohydrates" }}
  },
  
  // Group and calculate standard deviations -> both for avg and total
  {
    $group: {
      _id: "$Entity",
      std_animal: { $stdDevPop: "$animal" },
      std_vegetal: { $stdDevPop: "$vegetal" },
      std_fat: { $stdDevPop: "$fat" },
      std_carbs: { $stdDevPop: "$carbs" },
      total_intakes: {
        $push: {
          $add: ["$animal", "$vegetal", "$fat", "$carbs"]
        }
      }
    }
  },
  
  // Calculate variations
  {
    $project: {
      Entity: "$_id",
      avg_nutrient_var: {
        $divide: [
          { $add: ["$std_animal", "$std_vegetal", "$std_fat", "$std_carbs"] },
          4
        ]
      },
      total_intake_var: { $stdDevPop: "$total_intakes" }
    }
  },
  
  // Join happiness data 
  {
    $lookup: {
      from: "happiness",
      localField: "Entity",
      foreignField: "Country",
      as: "h"
    }
  },
  
  { $unwind: "$h" },
  
  // Final output
  {
    $project: {
      _id: 0,
      Entity: 1,
      avg_nutrient_var: 1,
      total_intake_var: 1,
      Happiness_Score: "$h.Happiness_Score",
      Happiness_Rank: "$h.Happiness_Rank"}
  },
  
  { $sort: { Happiness_Rank: 1 } }]);


//Q19: Processed Food Intake vs. Fast Food Menu Health
//1)
//Starbucks
db.starbucks.aggregate([
    {$group:{
        _id:"$type",  
        //select menu items by type
        avg_calories: {$avg: {$toDouble: "$calories"}},
        avg_fat: {$avg: {$toDouble: "$fat"}},
        avg_carb: {$avg: {$toDouble: "$carb"}},
        avg_fiber: {$avg: {$toDouble: "$fiber"}},
        avg_protein: {$avg: {$toDouble: "$protein"}}
        //calculate nutrient values
        }
    },
    {$sort:{avg_calories: -1}}
])

//Burger King
db.burger_king_menu.aggregate([
    {$group:{
        _id:"$Category",  
        //select menu items by Category
        avg_Calories: {$avg: {$toDouble: "$Calories"}},
        avg_Fat_Calories: {$avg: {$toDouble: "$Fat_Calories"}},
        avg_Fat_g: {$avg: {$toDouble: "$Fat_g"}},
        avg_Saturated_Fat_g: {$avg: {$toDouble: "$Saturated_Fat_g"}},
        avg_Trans_Fat_g: {$avg: {$toDouble: "$Trans_Fat_g"}},
        avg_Cholesterol_mg: {$avg: {$toDouble: "$Cholesterol_mg"}},
        avg_Sodium_mg: {$avg: {$toDouble: "$Sodium_mg"}},
        avg_Total_Carb_g: {$avg: {$toDouble: "$Total_Carb_g"}},
        avg_Dietary_Fiber_g: {$avg: {$toDouble: "$Dietary_Fiber_g"}},
        avg_Sugars_g: {$avg: {$toDouble: "$Sugars_g"}},
        avg_Protein_g: {$avg: {$toDouble: "$Protein_g"}}
        //calculate nutrient values
        }
    },
    {$sort:{avg_Calories: -1}}
])

//Mcdonald’s
db.mcdonaldata.aggregate([
    {$group:{
        _id: "$menu",
        //select menu items by menu
        avg_calories: { $avg: { $convert: { input: "$calories", to: "double", onError: 0, onNull: 0 }}},
        avg_protein: { $avg: { $convert: { input: "$protien", to: "double", onError: 0, onNull: 0 }}},
        avg_total_fat: { $avg: { $convert: { input: "$totalfat", to: "double", onError: 0, onNull: 0 }}},
        avg_saturated_fat: { $avg: { $convert: { input: "$satfat", to: "double", onError: 0, onNull: 0 }}},
        avg_trans_fat: { $avg: { $convert: { input: "$transfat", to: "double", onError: 0, onNull: 0 }}},
        avg_cholesterol: { $avg: { $convert: { input: "$cholestrol", to: "double", onError: 0, onNull: 0 }}},
        avg_carbs: { $avg: { $convert: { input: "$carbs", to: "double", onError: 0, onNull: 0 }}},
        avg_sugar: { $avg: { $convert: { input: "$sugar", to: "double", onError: 0, onNull: 0 }}},
        avg_added_sugar: { $avg: { $convert: { input: "$addedsugar", to: "double", onError: 0, onNull: 0 }}},
        avg_sodium: { $avg: { $convert: { input: "$sodium", to: "double", onError: 0, onNull: 0 }}}
        //calculate nutrient values
        //since the data itself has weird symbols like Â 524.69Â so extra convert step is needed
        //hence it will convert to numbers when it can
        //else, it will treat as 0 if conversion fails
    },
    {$sort:{avg_calories: -1}}
])

//2)
db.daily_intake.aggregate([
    {$lookup:{
        from:"happiness",
        localField: "Entity", 
        foreignField: "Country", 
        as: "h"}
    },
    //in sql: left join happiness h on d.entity=h.country
    //lookup does the same thing but here in mongodb
    {$unwind:{path:"$h", preserveNullAndEmptyArrays: true }},
    //unpacks array to access fields directly
    {$match:{Year:"2015"}},
    //use year = 2015 as happiness score was only for the year 2015
    {$set:{
        daily_calorie_fat_intake:{$round: [{$convert: {input:"$Daily_calorie_fat", to:"double",onError: null,onNull:null}},2]
        }}
    },
    //convert Daily_calorie_fat to numeric — double
    //if no values assign as null
    //store in new field: daily_calorie_fat_intake
    {$project: {_id:0, Country: "$Entity",  daily_calorie_fat_intake:1, Happiness_Score:"$h.Happiness_Score"}},
    //extract columns of Country, daily_calorie_fat_intake and happiness_score
    { $sort: { daily_calorie_fat_intake: -1 }}
    //put countries with highest daily_calorie_fat_intake at the top
])


//3)
db.daily_intake.aggregate([
    {$match:{Year:{$in:["1961","2022"]}}},
    //to find increase of daily_calorie_fat intake from 1961 to 2022, hence we obtain the values of daily_calorie_fat from 1961 and 2022 by using match
    //the diff is then computed
    {$group:{
        _id:"$Entity",
        fat_1961:{$first:{$toDouble:"$Daily_calorie_fat"}},
        fat_2022:{$last:{$toDouble:"$Daily_calorie_fat"}}
        //group by country
        //make sure daily_calorie_fat of 2022 is used to subtract value of daily_calorie_fat of 1961
    }},
    {$project:{_id:0,country:"$_id",fat_1961:1,fat_2022:1,increase_in_daily_fat_intake:{$subtract:["$fat_2022","$fat_1961"]}}},
    //extract the columns
    //resulting query shows country, fat_1961, fat_2022 and the increase_in_daily_fat_intake from 1961-2022
    {$sort:{increase_in_daily_fat_intake:-1}},
    //put countries with highest increase at the top
    {$limit:5}
    //limit to the top 5 countries
])


//Q20: Does fast-food consumption increase health risk? Could the risk be mitigated?

//1. this output shows the fast food consumption ranking of the different countries, the amount of revenue they have earned annually and their average fat + carb and protein intake
db.fast_food_consumption_by_country_2025.aggregate([
  {
    $lookup: {
      from: "daily_intake",  //join with daily intake collection
      localField: "country", // the matching field name in fast_food_consumption_by_country_2025
      foreignField: "Entity", // the matching field name in daily_intake
      as: "intake" //name of the resulting array field storing the matched documents
    }
  },
  { $unwind: {path: "$intake", preserveNullAndEmptyArrays: true}}, //expands the array so that each document correspinds to 1 year
  {
    $match: {
      $expr: {
        $and: [
          { $gte: [ { $toInt: "$intake.Year" }, 2000 ] }, //includes years >= 2000
          { $lte: [ { $toInt: "$intake.Year" }, 2020 ] } // and years <=2020
        ]
      }
    }
  },
  {
    $group: {
      _id: {
        country: "$country",  //grouping by country
        AnnualFastFoodRevenue: "$AnnualFastFoodRevenue_2023", //keep revenue information
        FastFoodConsumptionRanking: "$FastFoodConsumptionRanking_2022" //keep consumption rank
      },
      avg_fatcarb_intake: {
        $avg: {  // calculate average calories from fat and carbohydrates
          $add: [
            { $toDouble: "$intake.Daily_calorie_fat" },
            { $toDouble: "$intake.Daily_calorie_carbohydrates" }
          ]
        }
      },
      avg_protein_intake: {
        $avg: {  // calculate average calories from animal and vegetal protein
          $add: [ 
            { $toDouble: "$intake.Daily_calorie_animal_protein" }, 
            { $toDouble: "$intake.Daily_calorie_vegetal_protein" }
          ]
        }
      }
    }
  },
  {
    $project: {
      _id: 0, //hide the _id column from the output
      fast_food_consumption_rank: "$_id.FastFoodConsumptionRanking", //rename the fields in the output
      country: "$_id.country", //rename the fields in the output
      AnnualFastFoodRevenue: "$_id.AnnualFastFoodRevenue", //rename the fields in the output
      avg_fatcarb_intake: { $round: ["$avg_fatcarb_intake", 3] }, //rename the fields in the output
      avg_protein_intake: { $round: ["$avg_protein_intake", 3] } //rename the fields in the output
    }
  },
  {
    $match: { fast_food_consumption_rank: { $ne: null } } //exclude countries that don't show the fast food consumption ranking
  },
  { $sort: { fast_food_consumption_rank: 1 } } //sort by consumption ranking
]);


//2. this output shows the prevalence of overweight people in the diff countries 
db.fast_food_consumption_by_country_2025.aggregate([
  {
    $addFields: {
      normalizedCountry: {
        $switch: { //switch the names of the countries below to standardise and match with the country field in fast_food_consumption_by_country_2025 dataset
          branches: [
            { case: { $eq: ["$country", "South Korea"] }, then: "Korea, Rep." },
            { case: { $eq: ["$country", "Russia"] }, then: "Russian Federation" },
            { case: { $eq: ["$country", "Egypt"] }, then: "Egypt, Arab Rep." },
            { case: { $eq: ["$country", "Turkey"] }, then: "Turkiye" }
          ],
          default: "$country" //let the other countries follow the default country name
        }
      }
    }
  },
  {
    $lookup: { //join with overweight_clean dataset based on country names
      from: "overweight_clean",
      localField: "normalizedCountry",  
      foreignField: "Economy",
      as: "overweightData" //name of array created after joining
    }
  },
  { $unwind: "$overweightData" }, //expands the array so that each document corresponds to 1 country
  {
    $project: {
      _id: 0, //hide _id column
      country: 1, //shows country name in output
      prevalence_overweight: "$overweightData.Prevalence of overweight (% of adults)" //shows prevalence_overweight data
    }
  }
]);


//3.this output shows the the health rank and the health life expectancy
db.happiness.aggregate([
  {$addFields: {Health_Life_Expectancy_num:{ $toDouble: "$Health_Life_Expectancy"} } }, // ensures tha the health_life_expectancy value is converted to a numerical value
  {
    $setWindowFields: { //this function allows the countries to be ranked based on their health life expectancy
      sortBy: { Health_Life_Expectancy_num: -1 }, //health_life_expectancy is ranked in descending order (1 being highest)
      output: { health_rank: { $rank: {} } } //assign rank numbers
    }
  },
  { $addFields: { health_life_expectancy: { $round: ["$Health_Life_Expectancy_num", 3] } } }, //round the value of health life expectancy to 3 decimal places
  {
    $lookup: { //combine the fast_food_consumption_by_country_2025 dataset with the happiness dataset
      from: "fast_food_consumption_by_country_2025", //dataset containing fast food information
      localField: "Country", //matching field in happiness dataset
      foreignField: "country", //matching field in fast food consumption by country dataset
      as: "fastfood" //combine the results in a neew array with this name
    }
  },
  { $match: { fastfood: { $ne: [] } } },  //only keep countries that appear in both datasets
  {
    $project: { 
      _id: 0, // hide the _id column from the output
      "health_rank": "$health_rank", //output
      "Country": "$Country",  //output
      "health_life_expectancy": "$health_life_expectancy" //output
    }
  },
  { $sort: { "health_rank": 1 } } //arrange based on health rank
]);


//4. this output gives the country and their economies for better comparison
db.happiness.aggregate([
  {
    $addFields: {
      Economy_GDP_num: { $toDouble: "$Economy_GDP_per_Capita" }// Convert GDP per capita from string to number
    }
  },
  {
    $setWindowFields: { // Compute global economy rank
      sortBy: { Economy_GDP_num: -1 }, //rank in descending order
      output: { economy_rank: { $rank: {} } }
    }
  },
  {
    $addFields: {
      economy: { $round: ["$Economy_GDP_num", 3] } // Round GDP per capita
    }
  },
  {
    $project: { //show the relevant data
      _id: 0, 
      economy_rank: 1,
      Country: 1,
      economy: 1
    }
  },
  {
    $lookup: { // Join with fast_food_consumption_by_country_2025
      from: "fast_food_consumption_by_country_2025",
      localField: "Country",
      foreignField: "country",
      as: "fastfood"
    }
  },
  { $match: { fastfood: { $ne: [] } } },
  {
    $lookup: { // combine fast_food countries with daily_intake countries
      from: "daily_intake",
      localField: "Country",
      foreignField: "Entity",
      as: "intake"
    }
  },
  { $unwind: "$intake" }, //expands the array so that each document corresponds to 1 country
  {
    $match: {
      $expr: {
        $and: [
          { $gte: [ { $toInt: "$intake.Year" }, 2000 ] }, //consider from this year
          { $lte: [ { $toInt: "$intake.Year" }, 2020 ] } //consider to this year
        ]
      }
    }
  },
  {
    $group: { // Group back by country based on economy and economy rank to remove duplicates
      _id: "$Country",
      economy_rank: { $first: "$economy_rank" },
      economy: { $first: "$economy" }
    }
  },
  {
    $project: { //how output will be projected
      _id: 0, //hide _id column
      "economy_rank": "$economy_rank",
      "Country": "$_id",
      "economy": "$economy"
    }
  },
  { $sort: { "economy_rank": 1 } } // Sort by economy rank
]);


//5.this code is for the mitigation part to show the physical activity levels per country
db.physicalactivity.aggregate([
  {
    $lookup: { //combine dataset with fast_food_consumption_by_country_2025 on the basis of country name
      from: "fast_food_consumption_by_country_2025",
      localField: "country",
      foreignField: "country",
      as: "fastfood" //name of array created after combining datasets
    }
  },
  { $unwind: "$fastfood" }, //expand the array so that each document corresponds to 1 country
  {
    $project: { //select the relevant fields for the output
      _id: 0, //hide _id column
      country: 1,
      inactivity_adolescent_male: 1,
      inactivity_adolescent_female: 1,
      inactivity_adult_male: 1,
      inactivity_adult_female: 1,
      inactivity_70_male: 1,
      inactivity_70_female: 1,
      FastFoodConsumptionRanking_2022: "$fastfood.FastFoodConsumptionRanking_2022"
    }
  },
  { $sort: { FastFoodConsumptionRanking_2022: 1 } }, //arrange based on fast food consumption ranking
  {
    $project: { //how to output will be presented 
      country: 1,
      inactivity_adolescent_male: 1,
      inactivity_adolescent_female: 1,
      inactivity_adult_male: 1,
      inactivity_adult_female: 1,
      inactivity_70_male: 1,
      inactivity_70_female: 1
    }
  }
]);


//similar code as above but gives total inactivity rate per country
db.physicalactivity.aggregate([
  {
    $lookup: { // Join with the fast food consumption by country dataset on the basis of country name
      from: "fast_food_consumption_by_country_2025",
      localField: "country",
      foreignField: "country",
      as: "fastfood"
    }
  },
  {
    $unwind: "$fastfood"
  },

  {
    // Convert all inactivity fields to numeric values
    // If field contains "N/A", "", or invalid data --> convert to null
    $addFields: {
      inactivity_adolescent_male_num: {
        $convert: { 
          input: "$inactivity_adolescent_male",
          to: "double",
          onError: null,
          onNull: null
        }
      },
      inactivity_adolescent_female_num: {
        $convert: {
          input: "$inactivity_adolescent_female",
          to: "double",
          onError: null,
          onNull: null
        }
      },
      inactivity_adult_male_num: {
        $convert: {
          input: "$inactivity_adult_male",
          to: "double",
          onError: null,
          onNull: null
        }
      },
      inactivity_adult_female_num: {
        $convert: {
          input: "$inactivity_adult_female",
          to: "double",
          onError: null,
          onNull: null
        }
      },
      inactivity_70_male_num: {
        $convert: {
          input: "$inactivity_70_male",
          to: "double",
          onError: null,
          onNull: null
        }
      },
      inactivity_70_female_num: {
        $convert: {
          input: "$inactivity_70_female",
          to: "double",
          onError: null,
          onNull: null
        }
      }
    }
  },

  {
    // Compute average inactivity rate, treating null values as 0
    $addFields: {
      avg_inactivity_rate: {
        $round: [
          {
            $divide: [
              {
                $add: [
                  { $ifNull: ["$inactivity_adolescent_male_num", 0] },
                  { $ifNull: ["$inactivity_adolescent_female_num", 0] },
                  { $ifNull: ["$inactivity_adult_male_num", 0] },
                  { $ifNull: ["$inactivity_adult_female_num", 0] },
                  { $ifNull: ["$inactivity_70_male_num", 0] },
                  { $ifNull: ["$inactivity_70_female_num", 0] }
                ]
              },
              6
            ]
          },
          2
        ]
      }
    }
  },

  {
    // Sort countries by fast food consumption ranking
    $sort: { "fastfood.FastFoodConsumptionRanking_2022": 1 }
  },

  {
    // Final clean output
    $project: {
      _id: 0,
      country: 1,
      avg_inactivity_rate: 1
    }
  }
]);


//Q21: Long-term dietary transition for epidemiological analysis
db.daily_intake.aggregate([
  // Stage 1: Filter to only include United States data
  {
    $match: {
      Entity: "United States"  // Only get records for the United States
    }
  },
  
  // Stage 2: Convert string fields to numbers for calculation
  {
    $addFields: {
      // Convert each calorie field from string to number (double)
      animal_protein_num: { $toDouble: "$Daily_calorie_animal_protein" },
      vegetal_protein_num: { $toDouble: "$Daily_calorie_vegetal_protein" },
      fat_num: { $toDouble: "$Daily_calorie_fat" },
      carbohydrates_num: { $toDouble: "$Daily_calorie_carbohydrates" }
    }
  },
  
  // Stage 3: Group by Year and calculate averages for each nutritional category
  {
    $group: {
      _id: "$Year",  // Group all documents by Year field
      
      // Calculate average daily calories from animal protein per year
      avg_animal_protein: { 
        $avg: "$animal_protein_num"  // Use converted numeric field
      },
      
      // Calculate average daily calories from vegetal protein per year
      avg_vegetal_protein: { 
        $avg: "$vegetal_protein_num"  // Use converted numeric field
      },
      
      // Calculate average daily calories from fat per year
      avg_fat: { 
        $avg: "$fat_num"  // Use converted numeric field
      },
      
      // Calculate average daily calories from carbohydrates per year
      avg_carbohydrates: { 
        $avg: "$carbohydrates_num"  // Use converted numeric field
      },
      
      // Calculate average total daily calories by summing all categories
      avg_total: {
        $avg: {
          $add: [  // Add all four calorie sources together
            "$animal_protein_num",
            "$vegetal_protein_num",
            "$fat_num",
            "$carbohydrates_num"
          ]
        }
      }
    }
  },
  
  // Stage 4: Reshape the output to rename _id to Year and include calculated fields
  {
    $project: {
      _id: 0,  // Exclude the _id field from output
      Year: "$_id",  // Rename _id back to Year for clarity
      avg_animal_protein: 1,  // Include this field (1 = include)
      avg_vegetal_protein: 1,  // Include this field
      avg_fat: 1,  // Include this field
      avg_carbohydrates: 1,  // Include this field
      avg_total: 1  // Include this field
    }
  },
  
  // Stage 5: Sort results by Year in ascending order (oldest to newest)
  {
    $sort: { 
      Year: 1  // 1 = ascending order, -1 would be descending
    }
  }
]);


//Q22: 
//1: What months should governments increase public awareness of unhealthy food spikes?
//Query 1: seeing the total nutrient consumption for the 5 countries

db.simulated_food_intake_2015_2020.aggregate([{
    $addFields: { //converting fields to numerical
      Daily_calorie_animal_protein_num: { $toDouble: "$Daily_calorie_animal_protein" },
      Daily_calorie_vegetal_protein_num: { $toDouble: "$Daily_calorie_vegetal_protein" },
      Daily_calorie_fat_num: { $toDouble: "$Daily_calorie_fat" },
      Daily_calorie_carbohydrates_num: { $toDouble: "$Daily_calorie_carbohydrates" }}
  },
  {$group: { //finding average calories for each country
      _id: "$Entity",
      avg_animal_protein: { $avg: "$Daily_calorie_animal_protein_num" },
      avg_vegetal_protein: { $avg: "$Daily_calorie_vegetal_protein_num" },
      avg_fat: { $avg: "$Daily_calorie_fat_num" },
      avg_carbohydrates: { $avg: "$Daily_calorie_carbohydrates_num" }
    }
  },
  {$addFields: {
      total_calories: { //adding new coloumn of total calories for comparison
        $add: ["$avg_animal_protein",
              "$avg_vegetal_protein",
              "$avg_fat",
              "$avg_carbohydrates"]}}}
      ]);


// Query 2: seeing the total nutrient consumption for the 5 countries ranked for all 5 years
db.simulated_food_intake_2015_2020.aggregate([
  {$addFields: {
      total_daily_calories: { //creating new coloumn of total calories
        $add: [
          { $toDouble: "$Daily_calorie_animal_protein" },
          { $toDouble: "$Daily_calorie_vegetal_protein" },
          { $toDouble: "$Daily_calorie_fat" },
          { $toDouble: "$Daily_calorie_carbohydrates" }]}}
  },
  {$group: { // to get the average per year per country
      _id: {
        Entity: "$Entity",
        Year: "$Year"
      },
      Avg_total_Calories: { $avg: "$total_daily_calories" }
    }
  },
  {$project: {
      _id: 0,
      Entity: "$_id.Entity",
      Year: "$_id.Year",
      Avg_total_Calories: { $round: ["$Avg_total_Calories", 2] }}
  },
  {$sort: { Avg_total_Calories: -1 }} //ranked by highest calorie first
]);



// Query 3: average total calories consumed by month in United States (ranked)
db.simulated_food_intake_2015_2020.aggregate([
  {$match: { Entity: "United States" }},
  {$addFields: { //converting coloumns to numerical
      Daily_calorie_animal_protein_num: { $toDouble: "$Daily_calorie_animal_protein" },
      Daily_calorie_vegetal_protein_num: { $toDouble: "$Daily_calorie_vegetal_protein" },
      Daily_calorie_fat_num: { $toDouble: "$Daily_calorie_fat" },
      Daily_calorie_carbohydrates_num: { $toDouble: "$Daily_calorie_carbohydrates" }}
  },
  {$group: {//then getting the average for each month
      _id: "$Month",
      avg_animal_protein: { $avg: "$Daily_calorie_animal_protein_num" },
      avg_vegetal_protein: { $avg: "$Daily_calorie_vegetal_protein_num" },
      avg_fat: { $avg: "$Daily_calorie_fat_num" },
      avg_carbohydrates: { $avg: "$Daily_calorie_carbohydrates_num" }}
  },
  {$addFields: {//getting total calories to rank months by spike
      total_calories: {
        $add: [
          "$avg_animal_protein",
          "$avg_vegetal_protein",
          "$avg_fat",
          "$avg_carbohydrates"
        ]
      }}},
  {$project: {
      _id: 0,
      Month: "$_id",
      avg_animal_protein: 1,
      avg_vegetal_protein: 1,
      avg_fat: 1,
      avg_carbohydrates: 1,
      total_calories: 1
    }},
  {$sort: { total_calories: -1 }}
]);



// Query 4: Ranking all months in the US by total calorie consumption
//to see if the trend is not highly affected by a single month-> we look at each month of each year seperately
db.simulated_food_intake_2015_2020.aggregate([
  {$match: { Entity: "United States" }},
  {$addFields: {
      total_daily_calories: {
        $add: [//creating new coloumn of total calories
          { $toDouble: "$Daily_calorie_animal_protein" },
          { $toDouble: "$Daily_calorie_vegetal_protein" },
          { $toDouble: "$Daily_calorie_fat" },
          { $toDouble: "$Daily_calorie_carbohydrates" }]}}
  },
  {$group: {//finding total daily calories for each month for each year
      _id: {Entity: "$Entity",
            Year: "$Year",
            Month: "$Month"},
      total_Calories: { $avg: "$total_daily_calories" }
    }
  },
  {$project: {
      _id: 0,
      Entity: "$_id.Entity",
      Year: "$_id.Year",
      Month: "$_id.Month",
      total_Calories: { $round: ["$total_Calories", 2] }}
  },
  {$sort: { total_Calories: -1 } }
]);


// Query 5: All fastfood items
db.fastfood.find();


// Query 6: Calculate health score for fastfood items
//health score is out of 3 for each nutrient type and calories is also taken into 
//good nturients like protein and fiber and poor nutrients like sugar, sat fat and sodium
//total score is out of 18., the % to  determine the score is based on recommended daily consumption
db.fastfood.aggregate([
  {$addFields: {
    health_score: {$add: [
      // Protein score (higher is better)
      {$cond: [
        {$gte: [{$multiply: [{$divide: ["$protein", 50]}, 100]}, 20]}, 
        3, 
        {$cond: [
          {$and: [
            {$gte: [{$multiply: [{$divide: ["$protein", 50]}, 100]}, 6]}, 
            {$lte: [{$multiply: [{$divide: ["$protein", 50]}, 100]}, 19]}
          ]}, 
          2, 1
        ]}
      ]},
      
      // Fiber score (higher is better)
      {$cond: [
        {$gte: [{$multiply: [{$divide: ["$fiber", 25]}, 100]}, 20]}, 
        3, 
        {$cond: [
          {$and: [
            {$gte: [{$multiply: [{$divide: ["$fiber", 25]}, 100]}, 6]}, 
            {$lte: [{$multiply: [{$divide: ["$fiber", 25]}, 100]}, 19]}
          ]}, 
          2, 1
        ]}
      ]},
      
      // Saturated fat score (lower is better)
      {$cond: [
        {$lte: [{$multiply: [{$divide: ["$sat_fat", 20]}, 100]}, 5]}, 
        3, 
        {$cond: [
          {$and: [
            {$gte: [{$multiply: [{$divide: ["$sat_fat", 20]}, 100]}, 6]}, 
            {$lte: [{$multiply: [{$divide: ["$sat_fat", 20]}, 100]}, 19]}
          ]}, 
          2, 1
        ]}
      ]},
      
      // Sodium score (lower is better)
      {$cond: [
        {$lte: [{$multiply: [{$divide: ["$sodium", 2300]}, 100]}, 5]}, 
        3, 
        {$cond: [
          {$and: [
            {$gte: [{$multiply: [{$divide: ["$sodium", 2300]}, 100]}, 6]}, 
            {$lte: [{$multiply: [{$divide: ["$sodium", 2300]}, 100]}, 19]}
          ]}, 
          2, 1
        ]}
      ]},
      
      // Sugar score (lower is better)
      {$cond: [
        {$lte: [{$multiply: [{$divide: ["$sugar", 50]}, 100]}, 5]}, 
        3, 
        {$cond: [
          {$and: [
            {$gte: [{$multiply: [{$divide: ["$sugar", 50]}, 100]}, 6]}, 
            {$lte: [{$multiply: [{$divide: ["$sugar", 50]}, 100]}, 19]}
          ]}, 
          2, 1
        ]}
      ]},
      
      // Calories score (lower is better)
      {$cond: [{$lte: ["$calories", 300]}, 3, 
        {$cond: [
          {$and: [
            {$gte: ["$calories", 301]}, 
            {$lte: ["$calories", 600]}
          ]}, 
          2, 1
        ]}]}
    ]}
  }},
  {$project: {restaurant: 1, item: 1, health_score: 1}},
  {$sort: {health_score: -1}} // Ranked by healthiest fast food
]);
