
#Q5: List the average monthly intake by nutrient
select Month , round(avg(Daily_calorie_animal_protein),2 ) as avg_animal_protein, round( avg(Daily_calorie_vegetal_protein),2 ) as avg_vegetal_protein, 
	round(avg(Daily_calorie_fat), 2) as avg_fat, Round(avg(Daily_calorie_carbohydrates), 2) as avg_carbohydrates
    #using the avg() function to find the monthly average, and the round for readibility by converting it to 2dp
	from simulated_food_intake_2015_2020 
		group by month # to get the data in the same order as the result shown
			order by month;

#qn 6: finding which month is the peak for each type of nutrient for all the 5 entities.
-- Using subqueries to find the peak month for all 4 nutrient types.

select c.Entity,
 #  Fat spike month
    ( SELECT Month 
        FROM simulated_food_intake_2015_2020 AS f  
        WHERE f.Entity = c.Entity  #joining the two tables by Entity
        GROUP BY Month
        ORDER BY AVG(f.Daily_calorie_fat) DESC # to get the peak month
        LIMIT 1 # to only get the highest
    ) AS peak_month_fat,

    #  Animal protein spike month
    ( SELECT Month
        FROM simulated_food_intake_2015_2020 AS a
        WHERE a.Entity = c.Entity #joining the two tables by Entity
        GROUP BY Month
        ORDER BY AVG(a.Daily_calorie_animal_protein) DESC # to get the peak month
        LIMIT 1 # to only get the highest
    ) AS peak_month_animal,

    # Vegetal protein spike month
    ( SELECT Month
        FROM simulated_food_intake_2015_2020 AS v
        WHERE v.Entity = c.Entity #joining the two tables by Entity
        GROUP BY Month
        ORDER BY AVG(v.Daily_calorie_vegetal_protein) DESC# to get the peak month
        LIMIT 1 # to only get the highest
    ) AS peak_month_vegetal_protein,

    # Carbohydrates spike month
    ( SELECT Month
        FROM simulated_food_intake_2015_2020 AS carb
        WHERE carb.Entity = c.Entity #joining the two tables by Entity
        GROUP BY Month 
        ORDER BY AVG(carb.Daily_calorie_carbohydrates) DESC # to get the peak month
        LIMIT 1 # to only get the highest
    ) AS peak_month_carbohydrates

FROM ( SELECT DISTINCT Entity
  FROM simulated_food_intake_2015_2020
) AS c
ORDER BY c.Entity;

# Qn 9
SELECT 
item, 
totalfat, 
protien, 
totalfat/protien as fat_to_protein_ratio 
FROM mcdonaldata
GROUP BY item, totalfat, protien, fat_to_protein_ratio
ORDER BY fat_to_protein_ratio DESC;

# Qn 10
SELECT
	item, 
   	calories, 
totalfat, 
cholestrol, 
sodium, 
CASE 
WHEN totalfat > 30 OR sodium > 1000 OR cholestrol > 30 THEN '⚠ High Risk' 
	ELSE '✓ Moderate'
END as health_flag 
FROM mcdonaldata
WHERE calories not like '%Â%'		# filter out non float values of calories
GROUP BY item, calories, totalfat, cholestrol, sodium, health_flag
ORDER BY health_flag, calories DESC;


#Qn11
select Category, round(avg(Weight_Watchers), 2) as Avg_WW_Score #select Category, and calculate avg of Weight_Watchers score from Weight_Watchers column
from burger_king_menu
group by Category #group by category as we are obtaining Avg_WW_Score for each category of item
order by Avg_WW_Score; #ordered from smallest to largest Avg_WW_Score to achieve the order shown in the qn
#Ans: Breakfast is most weight watchers friendly



#Qn 12
select Item, Category, Calories #select columns of Item, Category and Calories as per question requirements
from burger_king_menu
order by Calories desc #question asked for most caloric items so order in descending order so items with highest calories are moved on top
limit 10; #question asked for top 10, so limit list of items to most caloric 10 items



#q13
select `type`, 
count(*) as count_items,  -- count the number of items for each type (eg no. of sandwiches, no. of bistro boxes, etc)
round(avg(calories)) as avg_calories, -- find the avg_calories for each type 
round(avg(fat)) as avg_fat, -- find the avg_fat for each type 
round(avg(protein)) as avg_protein -- find the avg_fat for each type

from starbucks -- from starbucks table

group by `type` 
order by avg_calories DESC;


#q14
select s.item, s.`type`,
s.calories as calories, 
round(avg_stats.avg_calories) as avg_calories, -- average calories
s.calories - round(avg_stats.avg_calories) as delta_from_avg -- difference in calories from average

from starbucks s -- dataset

join (
	select `type`, avg(calories) as avg_calories -- calculate average calories for each type
    from starbucks
    group by `type` -- group by type so that each type has 1 average
    ) as avg_stats using (`type`) -- join on type column
    order by s.`type`, calories DESC; -- sort by type from highest calories to lowest calories



#Qn 16
select 
	s.entity as country,
    round(avg(s.Daily_calorie_animal_protein + s.Daily_calorie_vegetal_protein),2) as avg_protein,
    round(avg(s.Daily_calorie_fat),2) as avg_fat,
    h.happiness_score
from simulated_food_intake_2015_2020 s
join happiness h on s.entity = h.country
where s.year = 2015 and ((s.entity in ('United States', 'India', 'Germany','Japan') and s.month in (12,1,2)) 
	or (s.entity = 'Brazil' and s.month in (6,7,8)))
group by s.entity, h.happiness_score;


#q17
select rank() over (order by round(h.happiness_score, 3) desc) as happiness_ranking, -- gives ranking of countries based on happiness score
	h.country, -- selecting country name from happiness dataset
	round(h.Happiness_Score, 3) as happiness_score, -- rounds the happiness score to 3 decimal place
	round(f.avg_fat_intake,2) as avg_fat_intake -- rounds the average fat intake to 3 decimal place

from happiness h -- take above data from this dataset

-- to calculate the average daily fat intake for each country between 1961 and 2020
join (
	select Entity as country, -- rename Entity to country
		avg(Daily_calorie_fat) as avg_fat_intake -- compute the average fat intake
    from daily_intake -- take data from this dataset
    where `Year` between 1961 and 2020 -- consider data only between these years
    group by Entity -- group based on country to get a single average value for each country
) f on h.country = f.country -- combine the happiness and the fat intake data based on the country names
order by happiness_ranking; -- output results based on happiness ranking (1: country with greatest happiness score)

#18;
-- Main query: Join nutrient variation data with happiness scores
SELECT  n.Entity,  n.avg_nutrient_var, n.total_intake_var,
    h.Happiness_Score,  h.Happiness_Rank,
    -- Rank countries by lowest variation (more stable = better rank)
    RANK() OVER (ORDER BY n.avg_nutrient_var ASC) AS rank_nutrientvar,
    RANK() OVER (ORDER BY n.total_intake_var ASC) AS rank_totalvar,
    -- Compare stability rank vs happiness rank (negative = more stable than happy, positive = happier than stable)
    (RANK() OVER (ORDER BY n.avg_nutrient_var ASC) - h.Happiness_Rank) AS diff_nutrient_vs_happy,
    (RANK() OVER (ORDER BY n.total_intake_var ASC) - h.Happiness_Rank) AS diff_total_vs_happy
FROM (
    -- Subquery: Calculate nutrient variation metrics for each country
    SELECT Entity,
        -- Method 1: Average variation across individual nutrient categories
        -- (measures how much each nutrient type varies independently)
        (STDDEV(Daily_calorie_animal_protein) + 
         STDDEV(Daily_calorie_vegetal_protein) + 
         STDDEV(Daily_calorie_fat) + 
         STDDEV(Daily_calorie_carbohydrates)) / 4 AS avg_nutrient_var,
        -- Method 2: Variation in total calorie intake
        -- (measures how much total daily calories vary over time)
        STDDEV(Daily_calorie_animal_protein + Daily_calorie_vegetal_protein + 
                Daily_calorie_fat + Daily_calorie_carbohydrates) AS total_intake_var
    FROM daily_intake
    GROUP BY Entity  -- Aggregate calculations per country
) n  -- subquery called 'n' for nutrient data
JOIN happiness h  -- Join with happiness table
ON n.Entity = h.Country  -- Match countries between the two tables
ORDER BY h.Happiness_Rank;  -- Sort by happiness ranking (best to worst)



#q19

#1)
#Starbucks
select 
	type,
    round(avg(calories),2) as avg_calories,
    round(avg(fat),2) as avg_fat,
    round(avg(carb),2) as avg_carb,
    round(avg(fiber),2) as avg_fiber,
    round(avg(protein),2) as avg_protein
    #select all columns except sn and item, as sn is irrelvant for nutrient analysis and item is too detailed, 
    #instead type is used to broadly classify the menu items for easier analysis
    #average values are calculated for the nutrients and rounded off to 2 d.p. for easier analysis
from starbucks
group by type
#get average nutrient values for each type of item sold
order by avg_calories desc; 
#put items with highest calories at the top for easier analysis

#Burger King
select 
	Category,
    round(avg(Calories),2) as avg_Calories,
    round(avg(Fat_Calories),2) as avg_Fat_Calories,
    round(avg(Fat_g),2) as avg_Fat_g,
    round(avg(Saturated_Fat_g),2) as avg_Saturated_Fat_g,
    round(avg(Trans_Fat_g),2) as avg_Trans_Fat_g,
    round(avg(Cholesterol_mg),2) as avg_Cholesterol_mg,
    round(avg(Sodium_mg),2) as avg_Sodium_mg,
    round(avg(Total_Carb_g),2) as avg_Total_Carb_g,
    round(avg(Dietary_Fiber_g),2) as avg_Dietary_Fiber_g,
    round(avg(Sugars_g),2) as avg_Sugars_g,
    round(avg(Protein_g),2) as avg_Protein_g
    #select all columns except Item and Weight_Watchers, as Weight_Watchers is irrelevant for nutrient analysis and Item is too detailed, 
    #instead Category is used to broadly classify the menu items for easier analysis
    #average values are calculated for the nutrients and rounded off to 2 d.p. for easier analysis
from burger_king_menu
group by Category
#get average nutrient values for each Category of item sold
order by avg_Calories desc; 
#put items with highest calories at the top for easier analysis

#Mcdonalds
select
	menu, 
    round(avg(calories),2) as avg_calories,
    round(avg(protien),2) as avg_protein,
    round(avg(totalfat),2) as avg_total_fat,
    round(avg(satfat),2) as avg_saturated_fat,
    round(avg(transfat),2) as avg_trans_fat,
    round(avg(cholestrol),2) as avg_cholesterol,
    round(avg(carbs),2) as avg_carbs,
    round(avg(sugar),2) as avg_sugar,
    round(avg(addedsugar),2) as avg_added_sugar,
    round(avg(sodium),2) as avg_sodium
    #select all columns except item and MyUnknownColumn, as MyUnknownColumn is irrelevant for nutrient analysis and item is too detailed, 
    #instead menu is used to broadly classify the menu items for easier analysis
    #average values are calculated for the nutrients and rounded off to 2 d.p. for easier analysis
from mcdonaldata
group by menu
#get average nutrient values for each type of menu sold
order by avg_calories desc;

#2)
#processed food intake and happiness
select
	d.entity as Country, 
    cast(d.Daily_calorie_fat as decimal (10,2)) as daily_calorie_fat_intake,
    #only select daily_calorie_fat column as it is the only relevant indicator of high processed food
    h.Happiness_Score
    #since we are showing relationship with happiness, select happiness score too
from daily_intake d
left join happiness h on d.entity=h.country
where cast(d.year as signed) = 2015
#Since the happiness dataset contains the happiness rank and scores by country for 2015, 
#only look at data from 2015 from the daily_intake table as well
order by daily_calorie_fat_intake desc; 
#put countries with highest fat intake on top

#3)
select 
	a.entity as country, 
    cast(a.Daily_calorie_fat as double) as fat_1961, #convert to numeric
    cast(b.Daily_calorie_fat as double) as fat_2022, #convert to numeric
    (cast(b.Daily_calorie_fat as double) - cast(a.Daily_calorie_fat as double)) as increase_in_daily_fat_intake
from daily_intake a 
join daily_intake b on a.entity = b.entity
where a.year = 1961 and b.year=2022 #take only start year of 1961 and end year of 2022
order by increase_in_daily_fat_intake desc #put the countries with greatest increase of calories from fat intake at the top
limit 5; #limit to only top 5 countries

#q20

-- 1. this output shows the fast food consumption ranking of the different countries, the amount of revenue they have earned annually and their average fat + carb and protein intake
select f.FastFoodConsumptionRanking_2022 as fast_food_consumption_rank,
	f.country,
    f.AnnualFastFoodRevenue_2023,
    round(avg(d.Daily_calorie_fat + d.Daily_calorie_carbohydrates),3) as avg_fatcarb_intake, -- avg fat+carb intake
    round(avg(d.Daily_calorie_animal_protein + d.Daily_calorie_vegetal_protein),3) as avg_protein_intake -- avg protein intake

from fast_food_consumption_by_country_2025 f

left join daily_intake d on f.country = d.Entity -- combine the fast food consumption by country data with the daily intake data
where d.`Year` between 2000 and 2020 -- consider the modern fast food consumption years (years when most countries had access to fast food)
group by f.FastFoodConsumptionRanking_2022, f.country, f.AnnualFastFoodRevenue_2023
order by f.FastFoodConsumptionRanking_2022;

-- 2. this output shows the prevalence of overweight people in the diff countries 
select f.country, -- country name from fast food consumptuion by country data
	o.prevalence_overweight -- overweight prevalence data from prevalence_overweight dataset
from fast_food_consumption_by_country_2025 f
join prevalence_overweight o on  
-- standardising the country names so that the data from the 2 datasets can match 
 case 
  when f.country = 'Korea, Rep.' then 'South Korea' 
  when f.country = 'Russian Federation' then 'Russia'
  when f.country = 'Egypt, Arab Rep.' then 'Egypt'
  when f.country = 'Turkiye' then 'Turkey'
  else f.country -- use orginal names for the remaining countries
 end = o.Economy -- match the standardised name to the 'Economy' field in the prevalence_overweight dataset
order by f.country desc;


-- 3. this output shows the the health rank and the health life expectancy
with health_ranked as ( -- create a new table to get health ranking for all the countries in the happiness dataset
	select Country,
		rank() over (order by Health_Life_Expectancy desc) as health_rank, -- rank all the countries in the happiness dataset (1 being best)
        round(Health_Life_Expectancy,3) as health_life_expectancy -- round of the health life expectancy value to 3 decimal places
	from happiness
)
-- get the health rank from the created table health_ranked
select h.health_rank, 
	h.Country,
    h.health_life_expectancy
from health_ranked h

where h.Country in (
	select distinct f.country
    from fast_food_consumption_by_country_2025 f
    join daily_intake d on f.country = d.Entity -- combine the daily intake data and the fast food consumption by country data using the common data, country
    where d.`Year` between 2000 and 2020 -- consider these years 
)
order by health_rank; 


-- 4. this output gives the country and their economies for better comparison
with economy_ranked as ( -- create a new table to get economy ranking for all the countries in the happiness dataset
	select Country,
		Economy_GDP_per_Capita,
		rank() over (order by Economy_GDP_per_Capita desc) as economy_rank -- gives ranking of economy (1 being best)
	from happiness
)
-- get the economy ranking from the created table
select e.economy_rank,
	e.Country,
    round(e.Economy_GDP_per_Capita,3) as economy
from economy_ranked e

where e.Country in (
	select distinct f.country
    from fast_food_consumption_by_country_2025 f
    join daily_intake d on f.country = d.Entity -- combine the daily intake data and the fast food consumption by country data using the common data, country
    where d.`Year` between 2000 and 2020 -- consider these years 
)
order by e.economy_rank;


-- 5. this code is for the mitigation part to show the physical activity levels per country
select p.country,
p.inactivity_adolescent_male,
	p.inactivity_adolescent_female,
	p.inactivity_adult_male,
	p.inactivity_adult_female,
	p.inactivity_70_male,
	p.inactivity_70_female
from `who_physical_activity_2022 - country profile` p
join fast_food_consumption_by_country_2025 f on p.country = f.country -- combine the datasets on the basis of country name which is a matching field 
order by f.FastFoodConsumptionRanking_2022;

-- similar code as above but gives total inactivity rate per country
select p.country,
	round(( p.inactivity_adolescent_male +
	p.inactivity_adolescent_female + 
	p.inactivity_adult_male +
	p.inactivity_adult_female +
	p.inactivity_70_male + 
	p.inactivity_70_female)/6 ,2) as total_inactivity
from `who_physical_activity_2022 - country profile` p
join fast_food_consumption_by_country_2025 f on p.country = f.country -- combine the datasets on the basis of country name which is a matching field 
order by f.FastFoodConsumptionRanking_2022;

#Q21: Finding nutritional shift in US 
SELECT 
    Year,
    AVG(Daily_calorie_animal_protein) AS avg_animal_protein,
    AVG(Daily_calorie_vegetal_protein) AS avg_vegetal_protein,
    AVG(Daily_calorie_fat) AS avg_fat,
    AVG(Daily_calorie_carbohydrates) AS avg_carbohydrates,
    AVG(Daily_calorie_animal_protein + Daily_calorie_vegetal_protein + Daily_calorie_fat + Daily_calorie_carbohydrates) AS avg_total
FROM daily_intake 
WHERE Entity = 'United States' # to only get US calorie intake
GROUP BY Year 
ORDER BY Year; #order of year

#qn 22
#1: What months should governments increase public awareness of unhealthy food spikes?

-- seeing the total nutrient consumption for the 5 countries

select Entity, 
	AVG(CAST(Daily_calorie_animal_protein AS DECIMAL(15,10))) avg_animal_protein,
	AVG(CAST(Daily_calorie_vegetal_protein AS DECIMAL(15,10))) avg_vegetal_protein,
	AVG(CAST(Daily_calorie_fat AS DECIMAL(15,10))) avg_fat,
	AVG(CAST(Daily_calorie_carbohydrates AS DECIMAL(15,10))) avg_carbohydrates,
    (avg(CAST(Daily_calorie_animal_protein AS DECIMAL(15,10))) +
     avg(CAST(Daily_calorie_vegetal_protein AS DECIMAL(15,10))) +
     avg(CAST(Daily_calorie_fat AS DECIMAL(15,10))) +
     avg(CAST(Daily_calorie_carbohydrates AS DECIMAL(15,10)))
    ) AS total_calories #creating new coloumn of total calories by summing up all 4 nutritents
	from simulated_food_intake_2015_2020
	group by Entity;
    
-- seeing the total nutrient consumption for the 5 countries ranked for all 5 years

SELECT
    Entity,
    Year,
    ROUND(
        AVG(
            CAST(Daily_calorie_animal_protein AS DECIMAL(15,10)) +
            CAST(Daily_calorie_vegetal_protein AS DECIMAL(15,10)) +
            CAST(Daily_calorie_fat AS DECIMAL(15,10)) +
            CAST(Daily_calorie_carbohydrates AS DECIMAL(15,10))
        ), 2
    ) AS Avg_total_Calories #creating new coloumn of total calories by summing up all 4 nutritents
FROM Simulated_Food_Intake_2015_2020
GROUP BY Entity, Year
ORDER BY avg_total_calories DESC; # in order of highest calories

-- average total calories consumed by month in United States

SELECT 
    month,
    AVG(CAST(Daily_calorie_animal_protein AS DECIMAL(15,10))) avg_animal_protein,
	AVG(CAST(Daily_calorie_vegetal_protein AS DECIMAL(15,10))) avg_vegetal_protein,
	AVG(CAST(Daily_calorie_fat AS DECIMAL(15,10))) avg_fat,
	AVG(CAST(Daily_calorie_carbohydrates AS DECIMAL(15,10))) avg_carbohydrates,
    (avg(CAST(Daily_calorie_animal_protein AS DECIMAL(15,10))) +
     avg(CAST(Daily_calorie_vegetal_protein AS DECIMAL(15,10))) +
     avg(CAST(Daily_calorie_fat AS DECIMAL(15,10))) +
     avg(CAST(Daily_calorie_carbohydrates AS DECIMAL(15,10)))
    ) AS total_calories #creating new coloumn of total calories by summing up all 4 nutritents
FROM simulated_food_intake_2015_2020
WHERE entity = 'United States'
GROUP BY month
order by total_calories DESC; # in order of highest calories

-- Ranking all months in the US by total calorie consumption
SELECT 
    Entity,
    Year,
    Month,
    ROUND(
        AVG(
            CAST(Daily_calorie_animal_protein AS DECIMAL(15,10)) +
            CAST(Daily_calorie_vegetal_protein AS DECIMAL(15,10)) +
            CAST(Daily_calorie_fat AS DECIMAL(15,10)) +
            CAST(Daily_calorie_carbohydrates AS DECIMAL(15,10))
        ), 2
    ) AS total_Calories
FROM Simulated_Food_Intake_2015_2020
WHERE Entity = 'United States'
GROUP BY Entity, Year, Month
ORDER BY total_Calories DESC;


#2) Are there healthy fast-food options that can be promoted via public campaigns?
-- seeing the dataset
select * from fastfood; 

-- finding the health score for the items
-- // Health score is out of 3 for each nutrient type and calories is also taken into account
-- // Good nutrients like protein and fiber and poor nutrients like sugar, sat fat and sodium
-- // Total score is out of 18, the % to determine the score is based on recommended daily consumption

SELECT
	restaurant,
    item,

    -- Positive nutrients (higher is better)
    CASE 
        WHEN (protein / 50 * 100) >= 20 THEN 3
        WHEN (protein / 50 * 100) BETWEEN 6 AND 19 THEN 2
        ELSE 1
    END +
    CASE 
        WHEN (fiber / 25 * 100) >= 20 THEN 3
        WHEN (fiber / 25 * 100) BETWEEN 6 AND 19 THEN 2
        ELSE 1
    END

    -- Negative nutrients (lower is better)
    +
    CASE 
        WHEN (sat_fat / 20 * 100) <= 5 THEN 3
        WHEN (sat_fat / 20 * 100) BETWEEN 6 AND 19 THEN 2
        ELSE 1
    END +
    CASE 
        WHEN (sodium / 2300 * 100) <= 5 THEN 3
        WHEN (sodium / 2300 * 100) BETWEEN 6 AND 19 THEN 2
        ELSE 1
    END +
    CASE 
        WHEN (sugar / 50 * 100) <= 5 THEN 3
        WHEN (sugar / 50 * 100) BETWEEN 6 AND 19 THEN 2
        ELSE 1
    END+
    CASE
        WHEN calories <= 300 THEN 3
        WHEN calories BETWEEN 301 AND 600 THEN 2
        ELSE 1
    END

    AS health_score

FROM fastfood
order by health_score DESC;
