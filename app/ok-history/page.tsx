"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import type { LatLon } from "./SatelliteMap";

const SatelliteMap = dynamic(() => import("./SatelliteMap"), { ssr: false,
  loading: () => <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
    justifyContent: "center", color: "#7a6548", fontSize: 13 }}>Loading satellite map…</div> });

// ─── Types ────────────────────────────────────────────────────────────
type Category = "history" | "person" | "fun" | "pop" | "sports";
interface Question {
  id: number;
  category: Category;
  text: string;
  place: string;
  fact: string;
  lat: number;
  lon: number;
}
interface Answer {
  qid: number;
  distance: number;
  score: number;
  rawScore: number;
  multiplier: number;
  tapLat: number;
  tapLon: number;
  outsideOK?: boolean;
}
interface DayResult {
  date: string;
  answers: Answer[];
  total: number;
}
interface Stats {
  played: number;
  totalScore: number;
  bestScore: number;
  streak: number;
  bestStreak: number;
  lastPlayedDate: string | null;
}

const CATEGORY_META: Record<Category, { label: string; emoji: string; color: string }> = {
  history: { label: "HISTORY", emoji: "🏛️", color: "#1a3a5c" },
  person: { label: "FAMOUS OKLAHOMAN", emoji: "⭐", color: "#7a4a1a" },
  fun: { label: "FUN TRIVIA", emoji: "🎉", color: "#8a1a5c" },
  pop: { label: "POP CULTURE & MUSIC", emoji: "🎸", color: "#1a6b5c" },
  sports: { label: "SPORTS", emoji: "🏈", color: "#8a1f1a" },
};

// ─── Question bank (100 questions) ─────────────────────────────────────
const QUESTIONS: Question[] = [
  // ── History (25) ──
  { id: 1, category: "history", place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "On April 22, 1889, thousands of settlers raced to stake claims here in the very first Oklahoma Land Run, turning open prairie into a tent city of 10,000 people by nightfall.",
    fact: "Oklahoma City became the state capital in 1910, after a contested vote moved it from Guthrie." },
  { id: 2, category: "history", place: "Guthrie", lat: 35.8786, lon: -97.4256,
    text: "This city served as Oklahoma's first state capital when statehood was declared in 1907 — before the capital was moved in a controversial 1910 election.",
    fact: "Guthrie's downtown is one of the largest contiguous urban historic districts in the U.S., largely because the town was frozen in time after losing the capital." },
  { id: 3, category: "history", place: "Tulsa", lat: 36.1540, lon: -95.9928,
    text: "Once known as the 'Oil Capital of the World,' this city's Greenwood District — nicknamed 'Black Wall Street' — was destroyed in the 1921 race massacre.",
    fact: "Greenwood was one of the wealthiest Black communities in America before the massacre destroyed over 35 city blocks." },
  { id: 4, category: "history", place: "Boise City", lat: 36.7267, lon: -102.5171,
    text: "This remote Panhandle town holds a strange WWII distinction: it's the only place in the continental U.S. bombed by the American military — by accident, in 1943.",
    fact: "A B-17 crew mistook the town's lights for a practice bombing range and dropped six practice bombs on it." },
  { id: 5, category: "history", place: "Anadarko", lat: 35.0723, lon: -98.2437,
    text: "This city calls itself the 'Indian Capital of the Nation' and hosts the American Indian Exposition, one of the oldest Native gatherings in the country, every summer.",
    fact: "Anadarko is headquarters to several tribal nations, including the Caddo, Delaware, and Wichita." },
  { id: 6, category: "history", place: "Tahlequah", lat: 35.9151, lon: -94.9700,
    text: "This is the capital of the Cherokee Nation and one of the endpoints of the Trail of Tears into Indian Territory.",
    fact: "Tahlequah was founded in 1839, shortly after the forced removal of the Cherokee from the southeastern United States." },
  { id: 7, category: "history", place: "Bartlesville", lat: 36.7473, lon: -95.9808,
    text: "In 1897, the Nellie Johnstone No. 1 well blew in here, launching Oklahoma's first commercial oil boom.",
    fact: "Bartlesville later became headquarters to Phillips Petroleum, one of the giants of the American oil industry." },
  { id: 8, category: "history", place: "Ardmore", lat: 34.1743, lon: -97.1436,
    text: "On September 27, 1915, a massive nitroglycerin explosion tore through this southern Oklahoma oil town, killing dozens and leveling much of downtown.",
    fact: "The blast was heard over 75 miles away and remains one of the deadliest industrial disasters in state history." },
  { id: 9, category: "history", place: "Enid", lat: 36.3956, lon: -97.8784,
    text: "This city sprang up almost overnight after the Cherokee Outlet Land Run of 1893 — one of the largest land runs in U.S. history.",
    fact: "Nearly 100,000 people raced for claims in the Cherokee Outlet on a single day, September 16, 1893." },
  { id: 10, category: "history", place: "Moore", lat: 35.3395, lon: -97.4867,
    text: "An EF5 tornado tore through this Oklahoma City suburb on May 20, 2013, one of the costliest and deadliest tornadoes in U.S. history.",
    fact: "Moore was hit by violent tornadoes in 1999, 2003, and again in 2013 — an unusual repeat target for EF5-strength storms." },
  { id: 11, category: "history", place: "Spiro Mounds", lat: 35.2848, lon: -94.6252,
    text: "This ancient Native American mound complex near the Arkansas border was a major trade and ceremonial center over 1,000 years ago.",
    fact: "Spiro Mounds produced some of the finest pre-Columbian art and artifacts ever found in North America." },
  { id: 12, category: "history", place: "Fort Gibson", lat: 35.7998, lon: -95.2530,
    text: "Founded in 1824 along the Grand River, this was the first permanent U.S. military post established in what is now Oklahoma.",
    fact: "Fort Gibson later served as a staging point for tribes arriving at the end of the Trail of Tears." },
  { id: 13, category: "history", place: "Woodward", lat: 36.4336, lon: -99.3904,
    text: "On April 9, 1947, one of the deadliest tornadoes in U.S. history killed over 100 people in and around this northwestern Oklahoma city.",
    fact: "The 1947 Woodward tornado struck before modern warning systems existed, giving residents almost no notice." },
  { id: 14, category: "history", place: "Sallisaw", lat: 35.4609, lon: -94.7908,
    text: "Near this eastern Oklahoma town lived Sequoyah, who single-handedly created a writing system for the Cherokee language in the early 1820s.",
    fact: "Sequoyah's syllabary made the Cherokee Nation one of the most literate populations in North America within a few years of its adoption." },
  { id: 15, category: "history", place: "Okmulgee", lat: 35.6234, lon: -95.9538,
    text: "This city has served as the capital of the Muscogee (Creek) Nation since the tribe's forced removal from the southeastern U.S. in the 1830s.",
    fact: "Okmulgee's Creek Council House, built in 1878, still stands today as a museum." },
  { id: 31, category: "history", place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "In 1937, a local grocer here named Sylvan Goldman invented a folding-frame cart to help customers carry more purchases — an idea that changed shopping forever.",
    fact: "Goldman reportedly hired models to push his new 'shopping carts' around his Humpty Dumpty stores to get skeptical customers to try them." },
  { id: 32, category: "history", place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "On April 19, 1995, a truck bomb destroyed the Alfred P. Murrah Federal Building here, killing 168 people in the deadliest act of domestic terrorism in U.S. history.",
    fact: "The site is now the Oklahoma City National Memorial, with 168 empty chairs honoring each victim." },
  { id: 33, category: "history", place: "Tulsa", lat: 36.1540, lon: -95.9928,
    text: "A police officer here named Clinton Riggs designed the distinctive triangular road sign that tells American drivers to yield.",
    fact: "The Tulsa Police Department tested Riggs's yellow YIELD sign on city streets in the 1950s before it spread nationwide." },
  { id: 34, category: "history", place: "Beggs", lat: 35.7492, lon: -96.0227,
    text: "A steel guitarist from this small town, Bob Dunn, built one of the first electrically amplified guitars in 1935 — years before the idea caught on nationally.",
    fact: "Dunn's amplified steel guitar helped pave the way for the electric guitars that would define rock and roll." },
  { id: 35, category: "history", place: "Pawhuska", lat: 36.6759, lon: -96.3336,
    text: "This Osage Nation capital was the site of a string of unsolved murders of wealthy Osage oil-rights holders in the 1920s, later investigated by the young FBI.",
    fact: "The Osage 'Reign of Terror' murders were the subject of the bestselling book and film 'Killers of the Flower Moon.'" },
  { id: 36, category: "history", place: "Wewoka", lat: 35.1470, lon: -96.4956,
    text: "This is the capital of the Seminole Nation, established after the tribe's forced removal to Indian Territory in the 1830s and 40s.",
    fact: "Wewoka means 'barking water' in the Seminole language, named for a nearby waterfall." },
  { id: 37, category: "history", place: "Muskogee", lat: 35.7479, lon: -95.3697,
    text: "This city was the federal government's administrative headquarters for overseeing the Five Civilized Tribes in Indian Territory during the late 1800s.",
    fact: "Muskogee is home to the Five Civilized Tribes Museum, housed in the old Union Indian Agency building." },
  { id: 38, category: "history", place: "Norman", lat: 35.2226, lon: -97.4395,
    text: "After decades of devastating tornadoes across the state, this university city became home to the National Severe Storms Laboratory and a hub for modern storm-warning research.",
    fact: "Norman's severe-weather research helped pioneer Doppler radar techniques now used to issue tornado warnings nationwide." },
  { id: 39, category: "history", place: "Guymon", lat: 36.6828, lon: -101.4816,
    text: "This Panhandle city sat at the center of the 1930s Dust Bowl, when massive dust storms buried farms and forced thousands of families to flee the region.",
    fact: "The most severe of these storms, on April 14, 1935, became known as 'Black Sunday.'" },
  { id: 40, category: "history", place: "McAlester", lat: 34.9339, lon: -95.7697,
    text: "Established during World War II, one of the largest ammunition production and storage facilities in the world still operates just outside this southeastern Oklahoma city.",
    fact: "The McAlester Army Ammunition Plant remains a major employer in the region today." },

  // ── Famous Oklahomans (25) ──
  { id: 16, category: "person", place: "Okemah", lat: 35.4323, lon: -96.3033,
    text: "A dust-bowl era folk singer who wrote 'This Land Is Your Land' was born in this small east-central Oklahoma town in 1912.",
    fact: "Woody Guthrie's songs about migrant workers and hard times went on to inspire Bob Dylan and generations of songwriters." },
  { id: 17, category: "person", place: "Oologah", lat: 36.4362, lon: -95.7080,
    text: "A rope-twirling cowboy humorist who famously said 'I never met a man I didn't like' was born on a ranch near this town in 1879.",
    fact: "Will Rogers became one of the most beloved entertainers and political commentators of the early 20th century." },
  { id: 18, category: "person", place: "Atoka", lat: 34.3878, lon: -96.1256,
    text: "A red-headed queen of country music grew up on a cattle ranch near this southeastern Oklahoma town — and in 2023 she opened a restaurant here bearing her first name.",
    fact: "Reba McEntire's restaurant, Reba's Place, opened in a century-old Masonic Temple in Atoka in partnership with the Choctaw Nation." },
  { id: 19, category: "person", place: "Yukon", lat: 35.5067, lon: -97.7395,
    text: "Born in Tulsa but raised from age four in this town just west of Oklahoma City, a future country superstar had a street renamed after him here in 1992: Garth Brooks Boulevard.",
    fact: "Garth Brooks went on to become one of the best-selling solo artists in U.S. history." },
  { id: 20, category: "person", place: "Shawnee", lat: 35.3273, lon: -96.9253,
    text: "A future Hollywood A-lister born here in 1963 can trace his Oklahoma roots back to the Land Run era.",
    fact: "Brad Pitt was born in Shawnee before his family later moved to Missouri." },
  { id: 21, category: "person", place: "Commerce", lat: 36.9384, lon: -94.8791,
    text: "A future New York Yankees legend, nicknamed 'The Commerce Comet,' grew up in this small mining town in Oklahoma's far northeast corner.",
    fact: "Mickey Mantle's father worked the lead and zinc mines here before Mickey became one of baseball's greatest switch-hitters." },
  { id: 22, category: "person", place: "Prague", lat: 35.4756, lon: -96.6825,
    text: "One of the greatest all-around athletes in history — an Olympic gold medalist in both the pentathlon and decathlon — was born on the Sac and Fox reservation near this town in 1888.",
    fact: "Jim Thorpe also played professional football and baseball, and the NFL's most valuable player trophy line traces its roots to his legacy." },
  { id: 23, category: "person", place: "Ryan", lat: 34.0273, lon: -97.9531,
    text: "A martial artist and action star known for roundhouse kicks — and for internet 'facts' claiming he can divide by zero — was born in this small southern Oklahoma town in 1940.",
    fact: "Chuck Norris trained in Tang Soo Do while stationed with the Air Force before launching his film career." },
  { id: 24, category: "person", place: "Checotah", lat: 35.4640, lon: -95.5305,
    text: "A country music powerhouse who won 'American Idol' in 2005 was born in nearby Muskogee but grew up on a farm in this small town, performing at the local talent show as a kid.",
    fact: "Carrie Underwood has since become one of the best-selling country artists of all time." },
  { id: 25, category: "person", place: "Clinton", lat: 35.5153, lon: -98.9679,
    text: "A country singer known for anthems like 'Should've Been a Cowboy' and 'Courtesy of the Red, White and Blue' was born in this Route 66 town in 1961.",
    fact: "Toby Keith was raised largely in Oklahoma City and often credited his Oklahoma roots for his songwriting." },
  { id: 41, category: "person", place: "Weatherford", lat: 35.5323, lon: -98.7020,
    text: "An astronaut born in this western Oklahoma town commanded three space missions, including Apollo 10 — the 'dress rehearsal' for the first Moon landing.",
    fact: "Thomas Stafford is honored with the Stafford Air & Space Museum in his hometown of Weatherford." },
  { id: 42, category: "person", place: "Enid", lat: 36.3956, lon: -97.8784,
    text: "An astronaut born in this city flew aboard Skylab 3 in 1973, spending nearly two months living aboard America's first space station.",
    fact: "Owen K. Garriott later became one of the first amateur radio operators to broadcast from orbit." },
  { id: 43, category: "person", place: "Bethany", lat: 35.5031, lon: -97.6314,
    text: "An astronaut raised in this Oklahoma City suburb once held the American record for the longest single spaceflight by a woman, after months aboard the Russian space station Mir.",
    fact: "Shannon Lucid became a national hero in 1996 after her 188-day mission aboard Mir." },
  { id: 44, category: "person", place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "The author of the landmark 1952 novel 'Invisible Man,' exploring Black identity in America, was born in this city in 1913.",
    fact: "Ralph Ellison's novel won the National Book Award and remains a cornerstone of 20th-century American literature." },
  { id: 45, category: "person", place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "An NBA All-Star forward and the first overall pick of the 2009 draft was born in this city and later starred collegiately at nearby Oklahoma University.",
    fact: "Blake Griffin became known for his explosive dunks and highlight-reel athleticism." },
  { id: 46, category: "person", place: "Edmond", lat: 35.6528, lon: -97.4781,
    text: "An Olympic gymnast who grew up in this Oklahoma City suburb became, at the time, the most decorated athlete in U.S. gymnastics history.",
    fact: "Shannon Miller won seven Olympic medals across the 1992 and 1996 Games." },
  { id: 47, category: "person", place: "Norman", lat: 35.2226, lon: -97.4395,
    text: "A future Emmy-winning actor known for playing rugged, everyman heroes on TV and in film was born in this university city in 1928.",
    fact: "James Garner starred in 'Maverick' and 'The Rockford Files' before a long, celebrated film career." },
  { id: 48, category: "person", place: "Maysville", lat: 34.8181, lon: -97.3986,
    text: "Near this small southern Oklahoma town, a farm boy who later became the first pilot to fly solo around the world was born in 1898.",
    fact: "Wiley Post also pioneered a pressurized flight suit, a forerunner of the modern spacesuit, before dying in a 1935 plane crash with Will Rogers." },
  { id: 49, category: "person", place: "Stilwell", lat: 35.8109, lon: -94.6238,
    text: "Near this far-eastern Oklahoma town lived the first woman ever elected Principal Chief of the Cherokee Nation.",
    fact: "Wilma Mankiller led the Cherokee Nation from 1985 to 1995 and remains one of the most influential Native American leaders in U.S. history." },
  { id: 50, category: "person", place: "Binger", lat: 35.2998, lon: -98.3492,
    text: "A future Cincinnati Reds Hall of Fame catcher, widely considered one of the greatest ever at his position, was raised in this small western Oklahoma town.",
    fact: "Johnny Bench won two World Series and was a 14-time All-Star during his career." },
  { id: 51, category: "person", place: "Miami", lat: 36.8742, lon: -94.8777,
    text: "A running back born in this far-northeastern Oklahoma city won the Heisman Trophy in 1969 while playing for the University of Oklahoma.",
    fact: "Steve Owens remains one of only a handful of Oklahoma Sooners to win college football's top individual honor." },
  { id: 52, category: "person", place: "Marshall", lat: 36.4834, lon: -97.6156,
    text: "One of Oklahoma's most respected historians, who wrote extensively about Native American and frontier history despite facing discrimination as a woman scholar, lived most of her life in this small town.",
    fact: "Angie Debo's work is still considered essential reading on the history of Indian Territory." },
  { id: 53, category: "person", place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "In 1958, a local NAACP Youth Council leader organized a sit-in at a downtown lunch counter here, one of the first successful sit-in protests of the civil rights era.",
    fact: "Clara Luper led the Katz Drug Store sit-in years before similar protests spread across the South." },
  { id: 54, category: "person", place: "Fairfax", lat: 36.5698, lon: -96.7061,
    text: "Born in this Osage Nation town in 1925, a woman became America's first major Native American prima ballerina, dancing lead roles for the New York City Ballet.",
    fact: "Maria Tallchief was renowned for originating the role of the Sugar Plum Fairy in George Balanchine's 'The Nutcracker.'" },
  { id: 55, category: "person", place: "Wetumka", lat: 35.2434, lon: -96.2400,
    text: "A member of the Chickasaw Nation from this small town became the first Native American to fly in space, aboard the Space Shuttle in 2002.",
    fact: "John Herrington performed a spacewalk during his mission and later biked across the country to encourage Native youth in science and math." },

  // ── Fun trivia (25) ──
  { id: 26, category: "fun", place: "Catoosa", lat: 36.1892, lon: -95.7469,
    text: "A big blue sea creature has called this landlocked Route 66 town home since 1972 — built out of iron and concrete as an anniversary gift, not an ocean in sight.",
    fact: "The Blue Whale of Catoosa was built by Hugh Davis as a surprise gift for his wife Zelta, who collected whale figurines." },
  { id: 27, category: "fun", place: "Tulsa", lat: 36.1478, lon: -95.9270,
    text: "A 76-foot-tall golden giant of a man, modeled after a real oilfield roughneck and engineered to survive 200-mph tornado winds, has towered over this city's fairgrounds since 1966.",
    fact: "The Golden Driller weighs 43,500 pounds and is one of the tallest statues in the United States." },
  { id: 28, category: "fun", place: "Foyil", lat: 36.3839, lon: -95.5127,
    text: "The world's largest concrete totem pole — 90 feet tall, covered in 200 carved images, and perched atop a giant turtle — rises from the prairie near this small town.",
    fact: "A retired art teacher named Ed Galloway spent over a decade, from 1937 to 1948, building Totem Pole Park by hand." },
  { id: 29, category: "fun", place: "Arcadia", lat: 35.6534, lon: -97.3239,
    text: "A 66-foot-tall soda bottle covered in LED lights glows over Route 66 at night in this small town, next to a shop selling more than 600 flavors of pop.",
    fact: "POPS sits beside Arcadia's century-old Round Barn, another beloved Route 66 landmark." },
  { id: 30, category: "fun", place: "Vinita", lat: 36.6417, lon: -95.1533,
    text: "For decades this town was home to the world's largest McDonald's — a restaurant built as a bridge spanning an entire interstate turnpike.",
    fact: "Opened in 1958 as 'The Glass House,' the building was renamed the Will Rogers Archway in 2014." },
  { id: 56, category: "fun", place: "Durant", lat: 33.9937, lon: -96.3708,
    text: "A four-foot-tall, 2,000-pound concrete peanut sits proudly on a pedestal in this southern Oklahoma town, celebrating a favorite regional crop.",
    fact: "Durant's giant peanut is one of many oversized roadside monuments scattered across Oklahoma's small towns." },
  { id: 57, category: "fun", place: "Arcadia", lat: 35.6534, lon: -97.3239,
    text: "Built in 1898 out of native sandstone, this town's round barn is one of the few true circular barns left standing anywhere along Route 66.",
    fact: "The design was believed by its builder to be more resistant to Oklahoma's fierce winds than a traditional square barn." },
  { id: 58, category: "fun", place: "Tulsa", lat: 36.1541, lon: -95.9963,
    text: "A 21-foot-tall cosmic cowboy in a spacesuit, holding a rocket ship, stands guard outside a curio shop along this city's stretch of Route 66.",
    fact: "The statue, nicknamed 'Buck Atom,' has become a popular photo stop for Route 66 road-trippers." },
  { id: 59, category: "fun", place: "Beaver", lat: 36.8098, lon: -100.5296,
    text: "Every April, this Panhandle town hosts the World Championship Cow Chip Throwing Contest, where competitors fling dried cow patties for distance.",
    fact: "The contest has been a beloved Beaver County tradition since the 1970s." },
  { id: 60, category: "fun", place: "Duncan", lat: 34.5023, lon: -97.9578,
    text: "Erle P. Halliburton founded his oilfield cementing company in this town in 1919, growing it into one of the world's largest energy services corporations.",
    fact: "Duncan is also home to the Chisholm Trail Heritage Center, honoring the historic cattle-driving route." },
  { id: 61, category: "fun", place: "Sulphur", lat: 34.5087, lon: -96.9761,
    text: "Natural mineral springs once believed to have healing powers made this town home to one of the smallest national parks in U.S. history before it was folded into a larger recreation area.",
    fact: "Platt National Park, established in 1906, is now part of the Chickasaw National Recreation Area." },
  { id: 62, category: "fun", place: "Watonga", lat: 35.8531, lon: -98.4234,
    text: "This western Oklahoma town has celebrated its dairy heritage every fall since the 1940s with a festival built around a local cheese factory.",
    fact: "The Watonga Cheese Festival draws visitors from across the state to sample fresh curds and cheddar." },
  { id: 63, category: "fun", place: "Hugo", lat: 34.0098, lon: -95.5197,
    text: "Nicknamed 'Circus City, USA,' this southeastern Oklahoma town has served as the off-season home for traveling circuses for decades, complete with a circus-performers' cemetery.",
    fact: "Hugo's Mount Olivet Cemetery includes a section called 'Showmen's Rest,' the final resting place of circus performers." },
  { id: 64, category: "fun", place: "Elk City", lat: 35.4120, lon: -99.4046,
    text: "A giant cowboy statue greets visitors outside the National Route 66 Museum in this western Oklahoma city.",
    fact: "The museum's exhibits trace the Mother Road's path across Oklahoma, which has more original miles of Route 66 than any other state." },
  { id: 65, category: "fun", place: "Broken Bow", lat: 34.0298, lon: -94.7385,
    text: "Nearby pine-covered mountains and a sparkling reservoir make this southeastern Oklahoma town feel more like the Ozarks than the plains most people picture.",
    fact: "Beavers Bend State Park, just outside town, is consistently ranked among Oklahoma's most-visited state parks." },
  { id: 66, category: "fun", place: "Claremore", lat: 36.3126, lon: -95.6081,
    text: "This town is home to the largest privately assembled firearms collection in the world, housed in a museum founded by a local businessman.",
    fact: "The J.M. Davis Arms & Historical Museum displays more than 20,000 guns." },
  { id: 67, category: "fun", place: "Pauls Valley", lat: 34.7401, lon: -97.2222,
    text: "Shelves of vintage action figures and toys fill a quirky museum in this south-central Oklahoma town, delighting collectors and nostalgic visitors alike.",
    fact: "The Toy and Action Figure Museum in Pauls Valley houses thousands of pieces spanning decades of pop culture." },
  { id: 68, category: "fun", place: "Idabel", lat: 33.8935, lon: -94.8232,
    text: "A museum in this far-southeastern Oklahoma town displays the bones of an ice-age mammoth unearthed nearby, alongside other regional natural history exhibits.",
    fact: "The Museum of the Red River in Idabel also features an extensive collection of pre-Columbian art." },
  { id: 69, category: "fun", place: "Chandler", lat: 35.7017, lon: -96.8814,
    text: "A distinctive 1930s stone armory building in this Route 66 town now serves as an interpretive center celebrating the highway's history.",
    fact: "The Route 66 Interpretive Center in Chandler occupies a National Guard armory built by the Works Progress Administration." },
  { id: 70, category: "fun", place: "Clinton", lat: 35.5153, lon: -98.9679,
    text: "This Route 66 town is home to the Oklahoma Route 66 Museum, tracing the highway's decades of evolution from dirt trail to interstate relic.",
    fact: "Clinton sits roughly at the midpoint of Oklahoma's stretch of the historic highway." },
  { id: 71, category: "fun", place: "Eufaula", lat: 35.2887, lon: -95.6377,
    text: "Sitting on Oklahoma's largest lake by surface area, this town proudly calls itself the 'Catfish Capital of the World.'",
    fact: "Lake Eufaula covers over 100,000 acres and is a major draw for anglers across the region." },
  { id: 72, category: "fun", place: "Grove", lat: 36.5956, lon: -94.7719,
    text: "Perched on the shore of Grand Lake o' the Cherokees, this town is home to a sprawling pioneer-village museum packed with antique buildings and artifacts.",
    fact: "Har-Ber Village Museum features dozens of reconstructed historic buildings overlooking the lake." },
  { id: 73, category: "fun", place: "Stroud", lat: 35.7473, lon: -96.6592,
    text: "A historic Route 66 diner in this small town, built from local roadbed stone in 1936, is said to have inspired a beloved animated film location.",
    fact: "The Rock Café in Stroud has been cited as an inspiration for a character's diner in Pixar's 'Cars.'" },
  { id: 74, category: "fun", place: "El Reno", lat: 35.5322, lon: -97.9550,
    text: "Legend says a Depression-era cook here stretched scarce ground beef by smashing it thin with a pile of onions, inventing a burger style now celebrated every May with its own festival.",
    fact: "El Reno's Fried Onion Burger Day draws thousands of visitors for a burger said to weigh over 700 pounds when made as a single giant patty." },
  { id: 75, category: "fun", place: "Davis", lat: 34.2334, lon: -97.1567,
    text: "Just outside this small town, water tumbles 77 feet down Oklahoma's tallest waterfall, a popular swimming spot carved into the Arbuckle Mountains.",
    fact: "Turner Falls Park has drawn Oklahoma swimmers and picnickers since the early 1900s." },

  // ── Pop culture & music (25) ──
  { id: 76, category: "pop", place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "A psychedelic rock band known for elaborate stage shows and the song 'Do You Realize??' formed in this city in 1983.",
    fact: "The Flaming Lips' frontman Wayne Coyne has become a beloved, larger-than-life fixture of Oklahoma City's arts scene." },
  { id: 77, category: "pop", place: "Tulsa", lat: 36.1540, lon: -95.9928,
    text: "Three brothers from this city formed a pop-rock band as teenagers, scoring a massive global hit in 1997 with 'MMMBop.'",
    fact: "Hanson has continued releasing music together for decades and still calls Tulsa home." },
  { id: 78, category: "pop", place: "Lawton", lat: 34.6036, lon: -98.3959,
    text: "A prolific session musician, songwriter, and producer nicknamed the 'Master of Space and Time' was born in this city in 1942.",
    fact: "Leon Russell wrote hits for other artists and was inducted into the Rock and Roll Hall of Fame in 2011." },
  { id: 79, category: "pop", place: "Tulsa", lat: 36.1540, lon: -95.9928,
    text: "A laid-back guitarist raised in this city wrote 'After Midnight' and 'Cocaine,' songs that later became massive hits for Eric Clapton.",
    fact: "J.J. Cale's understated style helped define what became known as the 'Tulsa Sound.'" },
  { id: 80, category: "pop", place: "Maud", lat: 34.8506, lon: -96.7717,
    text: "Dubbed the 'Queen of Rockabilly,' a pioneering female rock and roll singer was born in this small town in 1937.",
    fact: "Wanda Jackson toured with Elvis Presley early in her career and was inducted into the Rock and Roll Hall of Fame in 2009." },
  { id: 81, category: "pop", place: "Norman", lat: 35.2226, lon: -97.4395,
    text: "A country singer-songwriter born in this city has won 21 Grammy Awards, more than almost any other country artist in history.",
    fact: "Vince Gill is also a longtime member of the Eagles and a fixture of the Grand Ole Opry." },
  { id: 82, category: "pop", place: "Broken Arrow", lat: 36.0526, lon: -95.7908,
    text: "A Tony and Emmy-winning actress and singer known for originating a lead role in Broadway's 'Wicked' was born in this Tulsa suburb.",
    fact: "Kristin Chenoweth later starred in the TV series 'Pushing Daisies' and 'Glee.'" },
  { id: 83, category: "pop", place: "Ada", lat: 34.7746, lon: -96.6783,
    text: "A country singer born in this town in 1976 became a longtime coach on NBC's singing competition 'The Voice.'",
    fact: "Blake Shelton has racked up numerous CMA and ACM Awards throughout his career." },
  { id: 84, category: "pop", place: "Wakita", lat: 36.8748, lon: -97.9836,
    text: "This tiny north-central Oklahoma town became the primary filming location for a 1996 blockbuster about storm-chasers hunting tornadoes.",
    fact: "'Twister' filming brought Hollywood attention to Wakita, which still hosts a small museum devoted to the movie." },
  { id: 85, category: "pop", place: "Owasso", lat: 36.2695, lon: -95.8547,
    text: "Director Francis Ford Coppola filmed much of his 1983 classic here, based on a novel by a Tulsa-born teenage author about rival teenage gangs.",
    fact: "'The Outsiders' was based on S.E. Hinton's novel, written when she was still a teenager herself." },
  { id: 86, category: "pop", place: "Pawhuska", lat: 36.6759, lon: -96.3336,
    text: "This Osage Nation town has hosted major Hollywood productions, including a 2013 film starring Meryl Streep and a 2023 Martin Scorsese epic about its own dark history.",
    fact: "'August: Osage County' and 'Killers of the Flower Moon' were both filmed extensively in and around Pawhuska." },
  { id: 87, category: "pop", place: "Okmulgee", lat: 35.6234, lon: -95.9538,
    text: "An acclaimed FX comedy series following four Indigenous teenagers in rural Oklahoma was filmed extensively in and around this town.",
    fact: "'Reservation Dogs' was praised for its almost entirely Indigenous cast and creative team." },
  { id: 88, category: "pop", place: "Muskogee", lat: 35.7479, lon: -95.3697,
    text: "Merle Haggard's 1969 song about small-town, flag-waving pride put this city's name into the American pop-culture lexicon, even though Haggard himself was from California.",
    fact: "'Okie from Muskogee' became one of the most famous — and debated — songs of its era." },
  { id: 89, category: "pop", place: "Bartlesville", lat: 36.7473, lon: -95.9808,
    text: "The only skyscraper legendary architect Frank Lloyd Wright ever saw built stands in this small Oklahoma city.",
    fact: "The 19-story Price Tower, completed in 1956, is now a National Historic Landmark." },
  { id: 90, category: "pop", place: "Guthrie", lat: 35.8786, lon: -97.4256,
    text: "Scenes from the Best Picture-winning 1988 film 'Rain Man,' starring Dustin Hoffman and Tom Cruise, were filmed in this historic Oklahoma town.",
    fact: "Guthrie's well-preserved Victorian-era downtown has made it a popular filming location for period pieces." },
  { id: 91, category: "pop", place: "Ponca City", lat: 36.7065, lon: -97.0856,
    text: "An oil baron who later became Oklahoma's governor built a 55-room mansion here, nicknamed the 'Palace on the Prairie,' that has since appeared in film and television.",
    fact: "The Marland Mansion was built by E.W. Marland in the 1920s and remains one of the state's grandest historic homes." },
  { id: 92, category: "pop", place: "Miami", lat: 36.8742, lon: -94.8777,
    text: "An ornate 1929 Spanish Mission Revival movie palace along Route 66 in this town still hosts live performances today.",
    fact: "The Coleman Theatre's opulent interior earned it a spot on the National Register of Historic Places." },
  { id: 93, category: "pop", place: "Tulsa", lat: 36.1520, lon: -95.9910,
    text: "A legendary honky-tonk dance hall in this city launched the 'Western Swing' sound of Bob Wills and His Texas Playboys in the 1930s, and decades later hosted the Sex Pistols' infamous only U.S. tour stop.",
    fact: "Cain's Ballroom remains one of the most storied music venues in American history." },
  { id: 94, category: "pop", place: "Gene Autry", lat: 34.3298, lon: -97.1364,
    text: "This tiny town renamed itself in 1941 in honor of a singing cowboy movie star who broadcast a radio show from the area.",
    fact: "The town of Gene Autry, Oklahoma is home to the small Gene Autry Oklahoma Museum celebrating the era of singing cowboys." },
  { id: 95, category: "pop", place: "Sapulpa", lat: 35.9987, lon: -96.1142,
    text: "A ceramics factory founded here in 1933 became one of the most recognizable pottery brands in America, prized by collectors for its distinctive glazes.",
    fact: "Frankoma Pottery pieces remain highly sought after at flea markets and antique shows nationwide." },
  { id: 96, category: "pop", place: "Cushing", lat: 35.9851, lon: -96.7642,
    text: "Known as the 'Pipeline Crossroads of the World,' this small city's name is announced on financial news broadcasts around the globe every day as an oil-price benchmark location.",
    fact: "The WTI crude oil price quoted worldwide is often specifically priced for delivery at Cushing, Oklahoma." },
  { id: 97, category: "pop", place: "Poteau", lat: 35.0512, lon: -94.6238,
    text: "Nearby Cavanal Hill is billed as the world's highest hill — its makers say it falls just short of the technical definition of a mountain, a quirky claim to fame featured in Ripley's Believe It or Not.",
    fact: "Cavanal Hill rises about 1,999 feet, reportedly just below the 2,000-foot mountain threshold." },
  { id: 98, category: "pop", place: "Claremore", lat: 36.3126, lon: -95.6081,
    text: "A playwright born in this town in 1899 wrote 'Green Grow the Lilacs,' the play that Rodgers and Hammerstein later adapted into a landmark Broadway musical named after the state itself.",
    fact: "Lynn Riggs's play became the basis for 'Oklahoma!,' the first musical from the legendary Rodgers and Hammerstein partnership." },
  { id: 99, category: "pop", place: "Stillwater", lat: 36.1156, lon: -97.0584,
    text: "Long before global superstardom, a future country music icon played local bars in this college town while attending Oklahoma State University in the 1980s.",
    fact: "Garth Brooks has credited his years in Stillwater with shaping the performer he became." },
  { id: 100, category: "pop", place: "Pawnee", lat: 36.3384, lon: -96.7986,
    text: "A famous traveling Wild West show, featuring trick riders and sharpshooters, was headquartered near this town in the early 1900s, part of a national craze for frontier-themed entertainment.",
    fact: "Pawnee Bill's Wild West Show toured the country alongside contemporaries like Buffalo Bill's, blending real ranch life with theatrical spectacle." },

  // ── Sports (50) ──
  { id: 101, category: "sports", place: "Norman", lat: 35.2226, lon: -97.4395,
    text: "This university's quarterback won the Heisman Trophy in 2017 before becoming the #1 overall pick of the 2018 NFL Draft by the Cleveland Browns.",
    fact: "Baker Mayfield went on to start for several NFL teams after his standout OU career." },
  { id: 102, category: "sports", place: "Norman", lat: 35.2226, lon: -97.4395,
    text: "This university's quarterback won the 2018 Heisman Trophy, then turned down a first-round baseball contract to instead become the #1 overall pick of the 2019 NFL Draft.",
    fact: "Kyler Murray had been drafted by the Oakland Athletics in the MLB Draft before choosing football and going #1 to the Arizona Cardinals." },
  { id: 103, category: "sports", place: "Norman", lat: 35.2226, lon: -97.4395,
    text: "This university's quarterback won the 2008 Heisman Trophy and was the #1 overall pick of the 2010 NFL Draft, by the St. Louis Rams.",
    fact: "Sam Bradford's rookie contract set an NFL record at the time for a first-year player." },
  { id: 104, category: "sports", place: "Norman", lat: 35.2226, lon: -97.4395,
    text: "This university's quarterback won the Heisman Trophy in 2003, part of a remarkable stretch of Sooner Heisman winners in the 2000s and 2010s.",
    fact: "Jason White won the Heisman despite playing through multiple serious knee injuries during his college career." },
  { id: 105, category: "sports", place: "Norman", lat: 35.2226, lon: -97.4395,
    text: "This university's running back won the Heisman Trophy in 1978 and went on to a Hall of Fame NFL career with the Detroit Lions.",
    fact: "Billy Sims remains one of the most electrifying running backs in Sooners history." },
  { id: 106, category: "sports", place: "Norman", lat: 35.2226, lon: -97.4395,
    text: "This point guard played just one season of college basketball here before being drafted by the Dallas Mavericks in 2018 and immediately traded to the Atlanta Hawks.",
    fact: "Trae Young became an NBA All-Star known for his deep three-point range and playmaking." },
  { id: 107, category: "sports", place: "Norman", lat: 35.2226, lon: -97.4395,
    text: "This sharpshooting guard was named national college basketball Player of the Year here in 2016 before being drafted by the New Orleans Pelicans.",
    fact: "Buddy Hield became known in the NBA as one of the league's most prolific three-point shooters." },
  { id: 108, category: "sports", place: "Norman", lat: 35.2226, lon: -97.4395,
    text: "This basketball star played here in the 1980s before an NBA career with three teams — then reinvented himself as a successful smooth jazz bassist.",
    fact: "Wayman Tisdale released several jazz albums after retiring from the NBA." },
  { id: 109, category: "sports", place: "Norman", lat: 35.2226, lon: -97.4395,
    text: "Under longtime coach Patty Gasso, this university's softball program has become one of the most dominant dynasties in the history of college sports, racking up national championships.",
    fact: "The OU Sooners softball team has produced multiple undefeated national championship seasons." },
  { id: 110, category: "sports", place: "Norman", lat: 35.2226, lon: -97.4395,
    text: "Under longtime coach K.J. Kindler, this university's gymnastics program has captured multiple NCAA national titles.",
    fact: "OU gymnastics is consistently ranked among the top programs in the country." },
  { id: 111, category: "sports", place: "Stillwater", lat: 36.1156, lon: -97.0584,
    text: "This university's running back won the Heisman Trophy in 1988 and went on to a Hall of Fame NFL career with the Detroit Lions.",
    fact: "Barry Sanders is considered one of the most elusive running backs in football history." },
  { id: 112, category: "sports", place: "Stillwater", lat: 36.1156, lon: -97.0584,
    text: "Wrestling at Gallagher-Iba Arena, this university's program has won more NCAA team championships than any other wrestling program in history.",
    fact: "Oklahoma State's wrestling dynasty dates back decades and remains a national powerhouse." },
  { id: 113, category: "sports", place: "Stillwater", lat: 36.1156, lon: -97.0584,
    text: "This university's basketball star was picked 17th overall in the 2000 NBA Draft by the Seattle SuperSonics, and a year later became the first player in franchise history to win the Slam Dunk Contest.",
    fact: "Desmond Mason averaged 18 points per game as a senior at Oklahoma State before his NBA career." },
  { id: 114, category: "sports", place: "Stillwater", lat: 36.1156, lon: -97.0584,
    text: "This university's running back went on to a Hall of Fame NFL career with the Buffalo Bills, helping lead them to four straight Super Bowl appearances.",
    fact: "Thurman Thomas was the NFL's Most Valuable Player in 1991." },
  { id: 115, category: "sports", place: "Stillwater", lat: 36.1156, lon: -97.0584,
    text: "This university's baseball stadium is named for a Muscogee Creek Nation alum who pitched in multiple World Series for the New York Yankees.",
    fact: "Allie Reynolds Stadium honors the Cowboy great, who threw two no-hitters in a single 1951 season for the Yankees." },
  { id: 116, category: "sports", place: "Stillwater", lat: 36.1156, lon: -97.0584,
    text: "This university's wrestling legend won Olympic gold at the 1988 Seoul Games and again at the 1992 Barcelona Games, becoming the first American wrestler in 80 years to win two Olympic golds.",
    fact: "John Smith later became Oklahoma State's head wrestling coach, building on the program's dynasty." },
  { id: 117, category: "sports", place: "Stillwater", lat: 36.1156, lon: -97.0584,
    text: "This university's wide receiver was a consensus All-American before becoming a first-round NFL Draft pick.",
    fact: "Justin Blackmon won back-to-back Biletnikoff Awards as the nation's top receiver in 2010 and 2011." },
  { id: 118, category: "sports", place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "In 2008, an NBA franchise relocated here from Seattle, becoming Oklahoma's first major professional sports team.",
    fact: "The team kept most of the Seattle SuperSonics' roster but adopted the new name Oklahoma City Thunder." },
  { id: 119, category: "sports", place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "This city's NBA team had a forward win league MVP in 2014, one of the franchise's signature seasons.",
    fact: "Kevin Durant averaged over 32 points per game during his 2013-14 MVP season with the Thunder." },
  { id: 120, category: "sports", place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "A point guard for this city's NBA team set multiple records for triple-doubles in a single season during the mid-2010s.",
    fact: "Russell Westbrook averaged a triple-double for an entire season multiple times, a feat once thought nearly impossible." },
  { id: 121, category: "sports", place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "This downtown arena has been home to Oklahoma's NBA franchise since it arrived in the city, under several different sponsor names over the years.",
    fact: "The arena is now known as Paycom Center, after previously being called the Ford Center and Chesapeake Energy Arena." },
  { id: 122, category: "sports", place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "In 2012, this city's NBA team made its only trip to the NBA Finals to date, falling to the Miami Heat.",
    fact: "That Thunder roster featured a young core of Kevin Durant, Russell Westbrook, and James Harden." },
  { id: 123, category: "sports", place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "This city's NBA guard won both the league MVP award and the scoring title in the 2024-25 season, cementing himself as the face of the franchise.",
    fact: "Shai Gilgeous-Alexander averaged 32.7 points per game that season for the Thunder." },
  { id: 124, category: "sports", place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "The USA Softball Hall of Fame Stadium in this city hosts the NCAA Women's College World Series every year, the biggest stage in college softball.",
    fact: "Devon Park in Oklahoma City has hosted the Women's College World Series since 1990." },
  { id: 125, category: "sports", place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "Beyond college softball, this city's USA Softball national complex has also hosted international tournaments used to help qualify teams for the Olympic Games.",
    fact: "Oklahoma City's softball complex is considered one of the sport's premier venues worldwide." },
  { id: 126, category: "sports", place: "Tulsa", lat: 36.1478, lon: -95.9928,
    text: "This university's men's basketball team, seeded 15th, stunned the nation with a run to the Sweet 16 of the 2021 NCAA Tournament, upsetting both the 2nd and 7th seeds along the way.",
    fact: "Oral Roberts University became only the second 15-seed ever to reach the Sweet 16, led by star guard Max Abmas." },
  { id: 127, category: "sports", place: "Tulsa", lat: 36.1478, lon: -95.9928,
    text: "This city's NCAA Division I university, nicknamed the Golden Hurricane, has fielded competitive football and basketball programs for decades.",
    fact: "The University of Tulsa has produced numerous NFL and NBA players over the years." },
  { id: 128, category: "sports", place: "Edmond", lat: 35.6528, lon: -97.4781,
    text: "This city is home to the University of Central Oklahoma Bronchos, who compete in NCAA Division II athletics.",
    fact: "UCO fields one of the largest NCAA Division II athletic programs in the country." },
  { id: 129, category: "sports", place: "Edmond", lat: 35.6528, lon: -97.4781,
    text: "This city is also home to Oklahoma Christian University, whose Eagles compete in NCAA Division II.",
    fact: "Oklahoma Christian University and UCO give Edmond two competing college athletic programs." },
  { id: 130, category: "sports", place: "Ada", lat: 34.7746, lon: -96.6783,
    text: "This city is home to East Central University, whose Tigers compete in NCAA Division II athletics.",
    fact: "East Central University has been part of Ada's community since 1909." },
  { id: 131, category: "sports", place: "Durant", lat: 33.9937, lon: -96.3708,
    text: "This city is home to Southeastern Oklahoma State University, whose Savage Storm compete in NCAA Division II athletics.",
    fact: "Southeastern Oklahoma State has sent several players on to professional football careers." },
  { id: 132, category: "sports", place: "Weatherford", lat: 35.5323, lon: -98.7020,
    text: "This city is home to Southwestern Oklahoma State University, whose Bulldogs compete in NCAA Division II athletics.",
    fact: "SWOSU's campus has grown steadily since its founding in 1901." },
  { id: 133, category: "sports", place: "Tahlequah", lat: 35.9151, lon: -94.9700,
    text: "This city, the capital of the Cherokee Nation, is also home to Northeastern State University, whose RiverHawks compete in NCAA Division II.",
    fact: "Northeastern State is one of the oldest universities in Oklahoma, tracing its roots to 1846." },
  { id: 134, category: "sports", place: "Goodwell", lat: 36.5967, lon: -101.6415,
    text: "Tucked in the far western Panhandle, this town is home to Oklahoma Panhandle State University, the westernmost four-year college in the state.",
    fact: "OPSU's Aggies compete in NAIA athletics from one of the most remote college campuses in Oklahoma." },
  { id: 135, category: "sports", place: "Langston", lat: 35.9245, lon: -97.2569,
    text: "This town is home to Langston University, Oklahoma's only Historically Black College or University, known for a strong track and field tradition.",
    fact: "Langston University was founded in 1897 and remains a proud HBCU athletics program today." },
  { id: 136, category: "sports", place: "Lawton", lat: 34.6036, lon: -98.3959,
    text: "This city is home to Cameron University, whose Aggies compete in NCAA Division II athletics.",
    fact: "Cameron University fields a competitive wrestling program among its Division II sports." },
  { id: 137, category: "sports", place: "Claremore", lat: 36.3126, lon: -95.6081,
    text: "This city is home to Rogers State University, whose Hillcats compete in NAIA athletics.",
    fact: "Rogers State's athletics program has grown significantly since the school gained four-year status in the 1990s." },
  { id: 138, category: "sports", place: "Bartlesville", lat: 36.7473, lon: -95.9808,
    text: "This city is home to Oklahoma Wesleyan University, whose Eagles compete in NAIA athletics.",
    fact: "Oklahoma Wesleyan's men's basketball program has won multiple NAIA national championships." },
  { id: 139, category: "sports", place: "Shawnee", lat: 35.3273, lon: -96.9253,
    text: "This city is home to Oklahoma Baptist University, whose Bison compete in NCAA Division II athletics.",
    fact: "OBU has fielded competitive teams in cross country and basketball for decades." },
  { id: 140, category: "sports", place: "Oklahoma City", lat: 35.4676, lon: -97.5164,
    text: "This city is home to Oklahoma City University, whose Stars have historically fielded standout men's soccer and golf programs.",
    fact: "Oklahoma City University competes in NAIA athletics and has won numerous national titles across its programs." },
  { id: 141, category: "sports", place: "Chickasha", lat: 35.0526, lon: -97.9364,
    text: "This city is home to the University of Science and Arts of Oklahoma, whose Drovers compete in NAIA athletics.",
    fact: "USAO is one of the smallest public universities in the state." },
  { id: 142, category: "sports", place: "Alva", lat: 36.8081, lon: -98.6667,
    text: "This city is home to Northwestern Oklahoma State University, whose Rangers compete in NCAA Division II athletics.",
    fact: "Northwestern Oklahoma State serves the far northwestern corner of the state from its Alva campus." },
  { id: 143, category: "sports", place: "Bethany", lat: 35.5031, lon: -97.6314,
    text: "This Oklahoma City suburb is home to Southern Nazarene University, whose Crimson Storm compete in NCAA Division II athletics.",
    fact: "Southern Nazarene has fielded competitive programs in wrestling and track and field." },
  { id: 144, category: "sports", place: "Stillwater", lat: 36.1156, lon: -97.0584,
    text: "The fierce, decades-long athletic rivalry between Oklahoma's two biggest universities across every sport is nicknamed after this term for chaos and mayhem.",
    fact: "The 'Bedlam' rivalry between OU and Oklahoma State spans football, basketball, and virtually every other sport the schools share." },
  { id: 145, category: "sports", place: "Prague", lat: 35.4756, lon: -96.6825,
    text: "Born on the Sac and Fox reservation near this town, a legend once named 'Greatest Athlete of the First Half of the 20th Century' also helped found the organization that became the NFL.",
    fact: "Jim Thorpe served as the first president of the American Professional Football Association, the forerunner to the modern NFL." },
  { id: 146, category: "sports", place: "Stillwater", lat: 36.1156, lon: -97.0584,
    text: "This university's second wrestling legend of the 1988 Seoul Olympics won gold at 163 pounds with a dramatic overtime win over a Soviet opponent.",
    fact: "Kenny Monday later added an Olympic silver in 1992 and went on to coach alongside teammate John Smith at Oklahoma State." },
  { id: 147, category: "sports", place: "Norman", lat: 35.2226, lon: -97.4395,
    text: "In 2024, this university left the Big 12 Conference after decades of membership, joining the Southeastern Conference (SEC) alongside its in-state rival.",
    fact: "Both Oklahoma and Oklahoma State's conference realignment marked one of the biggest shakeups in modern college sports." },
  { id: 148, category: "sports", place: "Norman", lat: 35.2226, lon: -97.4395,
    text: "This university's legendary football coach won three national championships in the 1970s and 80s before later coaching the Dallas Cowboys to a Super Bowl title.",
    fact: "Barry Switzer is one of only a few coaches to win both a college football national championship and a Super Bowl." },
  { id: 149, category: "sports", place: "Norman", lat: 35.2226, lon: -97.4395,
    text: "This university's head football coach led the Sooners to a national championship in the 2000 season, his second year on the job.",
    fact: "Bob Stoops became one of the winningest coaches in Oklahoma football history over his 18 seasons leading the program." },
  { id: 150, category: "sports", place: "Stillwater", lat: 36.1156, lon: -97.0584,
    text: "This university's head football coach has held the job since 2005, becoming known nationally for an animated, viral postgame rant defending his players.",
    fact: "Mike Gundy's 'I'm a man! I'm 40!' speech in 2007 became one of the most-replayed moments in college football media history." },
];

const BASE_POINTS = 100;
const ALL_MULTIPLIERS = [1, 2, 3, 4, 5];
const DAILY_MIX: Category[] = ["history", "person", "fun", "pop", "sports"];

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function scoreFor(distance: number, max: number): number {
  return Math.round(max * Math.exp(-distance / 55));
}

// ─── Deterministic daily seed ─────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; }
  return h;
}
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function ordinal(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return `${n}st`;
  if (n % 10 === 2 && n % 100 !== 12) return `${n}nd`;
  if (n % 10 === 3 && n % 100 !== 13) return `${n}rd`;
  return `${n}th`;
}
function formatShareDate(dateKey: string): string {
  const [, m, d] = dateKey.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${ordinal(d)}`;
}
function shuffled<T>(arr: T[], rand: () => number): T[] {
  const pool = [...arr];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}
function questionsForDate(dateKey: string): Question[] {
  const rand = mulberry32(hashStr(dateKey));
  const used = new Set<number>();
  const picks: Question[] = [];
  for (const cat of DAILY_MIX) {
    const pool = QUESTIONS.filter(q => q.category === cat && !used.has(q.id));
    const pick = shuffled(pool, rand)[0] || shuffled(QUESTIONS.filter(q => !used.has(q.id)), rand)[0];
    if (pick) { picks.push(pick); used.add(pick.id); }
  }
  return shuffled(picks, rand);
}

// ─── Storage ──────────────────────────────────────────────────────────
function loadStats(): Stats {
  try {
    const raw = localStorage.getItem("okh-stats");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { played: 0, totalScore: 0, bestScore: 0, streak: 0, bestStreak: 0, lastPlayedDate: null };
}
function saveStats(s: Stats) { try { localStorage.setItem("okh-stats", JSON.stringify(s)); } catch {} }
function loadResult(dateKey: string): DayResult | null {
  try {
    const raw = localStorage.getItem(`okh-result-${dateKey}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
function saveResult(r: DayResult) { try { localStorage.setItem(`okh-result-${r.date}`, JSON.stringify(r)); } catch {} }

function yesterdayKey(dateKey: string): string {
  const d = new Date(dateKey + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Oklahoma-slang feedback, keyed off the raw 0-100 score BEFORE the confidence multiplier ──
interface FeedbackTier { min: number; emoji: string; label: string; lines: string[]; }
const FEEDBACK_TIERS: FeedbackTier[] = [
  { min: 100, emoji: "🥋", label: "CHUCK NORRIS APPROVED",
    lines: [
      "Well I'll be dipped in butter — that's a dead-on bullseye! Even Chuck Norris couldn't round-house kick it closer.",
      "That's slicker than a greased pig at the county fair — a straight-up perfect hit!",
    ] },
  { min: 90, emoji: "🍻", label: "ATTA BOY",
    lines: [
      "Well slap my knee, that's slicker than owl spit! Crack a cold one, you earned it.",
      "Now that right there is how a true Sooner — or Cowboy — does it. Cheers to you!",
    ] },
  { min: 75, emoji: "👌", label: "SOLID",
    lines: [
      "Not bad, not bad — you didn't just fall off the turnip truck.",
      "That's a fine bit of guessin', pardner. Right in the neighborhood.",
    ] },
  { min: 60, emoji: "🫪", label: "CLOSE ENOUGH FOR HORSESHOES",
    lines: [
      "Close, but no cigar — that's about as near as a horseshoe toss.",
      "You were in the county, at least. Gettin' warmer.",
    ] },
  { min: 45, emoji: "😬", label: "BLESS YOUR HEART",
    lines: [
      "Bless your heart, that guess wandered off like a lost calf.",
      "Ooh, that one strayed further than a tumbleweed in a dust storm.",
    ] },
  { min: 30, emoji: "🫠", label: "ROUGH AS A COB",
    lines: [
      "Whew, that's rougher than a cob. Better luck next question.",
      "That guess about melted right off the map, didn't it.",
    ] },
  { min: 15, emoji: "🥴", label: "OUT IN THE STICKS",
    lines: [
      "That guess is more lost than a goose in a hailstorm.",
      "Son, you're out in the sticks on that one.",
    ] },
  { min: 5, emoji: "🫣", label: "WAY OFF, HOSS",
    lines: [
      "That's further off than Boise City is from the nearest ocean.",
      "Yikes — did you close your eyes and just poke the map?",
    ] },
  { min: 1, emoji: "😢", label: "PLUMB LOST",
    lines: [
      "That guess done gone and got itself plumb lost out in the sticks.",
      "Well shoot, that one's sadder than a screen door on a submarine.",
    ] },
  { min: 0, emoji: "💩", label: "WHOLE LOTTA NOTHIN'",
    lines: [
      "Well butter my biscuit, that's a whole lotta nothin'.",
      "That guess landed about as close as Texas gettin' invited back to the Big 12.",
    ] },
];
function getFeedback(rawScore: number): FeedbackTier & { line: string } {
  const tier = FEEDBACK_TIERS.find(t => rawScore >= t.min) ?? FEEDBACK_TIERS[FEEDBACK_TIERS.length - 1];
  const line = tier.lines[Math.floor(Math.random() * tier.lines.length)];
  return { ...tier, line };
}
const OUTSIDE_OK_FEEDBACK: FeedbackTier & { line: string } = {
  min: 0, emoji: "🤠", label: "NOPE — SOONER SOIL", lines: [],
  line: "Nice try, buckaroo, but every last one of these happened right here in the great state of Oklahoma.",
};
function feedbackFor(a: Answer): FeedbackTier & { line: string } {
  return a.outsideOK ? OUTSIDE_OK_FEEDBACK : getFeedback(a.rawScore);
}

const ROUND_MAX = BASE_POINTS * ALL_MULTIPLIERS.reduce((a, b) => a + b, 0); // 1500

// ─── Component ────────────────────────────────────────────────────────
export default function OKHistoryGame() {
  const dateKey = useMemo(() => todayKey(), []);
  const questions = useMemo(() => questionsForDate(dateKey), [dateKey]);

  const [phase, setPhase] = useState<"loading" | "intro" | "playing" | "reveal" | "done">("loading");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [pendingTap, setPendingTap] = useState<LatLon | null>(null);
  const [selectedMultiplier, setSelectedMultiplier] = useState<number | null>(null);
  const [usedMultipliers, setUsedMultipliers] = useState<number[]>([]);
  const [lastAnswer, setLastAnswer] = useState<Answer | null>(null);
  const [stats, setStats] = useState<Stats>({ played: 0, totalScore: 0, bestScore: 0, streak: 0, bestStreak: 0, lastPlayedDate: null });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const s = loadStats();
    setStats(s);
    const existing = loadResult(dateKey);
    if (existing) {
      setAnswers(existing.answers);
      setPhase("done");
    } else {
      setPhase("intro");
    }
  }, [dateKey]);

  const current = questions[qIndex];

  const handlePick = useCallback((lat: number, lon: number) => {
    setPendingTap({ lat, lon });
  }, []);

  const submitGuess = useCallback((lat: number, lon: number, multiplier: number) => {
    if (!current) return;
    const distance = haversineMiles(lat, lon, current.lat, current.lon);
    const rawScore = scoreFor(distance, BASE_POINTS);
    const score = scoreFor(distance, BASE_POINTS * multiplier);
    const answer: Answer = { qid: current.id, distance, score, rawScore, multiplier, tapLat: lat, tapLon: lon };
    setLastAnswer(answer);
    setAnswers(p => [...p, answer]);
    setUsedMultipliers(p => [...p, multiplier]);
    setPhase("reveal");
  }, [current]);

  const submitOutsideOK = useCallback((multiplier: number) => {
    if (!current) return;
    const answer: Answer = { qid: current.id, distance: NaN, score: 0, rawScore: 0, multiplier, tapLat: NaN, tapLon: NaN, outsideOK: true };
    setLastAnswer(answer);
    setAnswers(p => [...p, answer]);
    setUsedMultipliers(p => [...p, multiplier]);
    setPendingTap(null);
    setPhase("reveal");
  }, [current]);

  const lockInGuess = () => {
    if (!pendingTap || !selectedMultiplier) return;
    submitGuess(pendingTap.lat, pendingTap.lon, selectedMultiplier);
  };

  const lockInOutsideOK = () => {
    if (!selectedMultiplier) return;
    submitOutsideOK(selectedMultiplier);
  };

  const handleDoubleClick = useCallback((lat: number, lon: number) => {
    setPendingTap({ lat, lon });
    setSelectedMultiplier(current => {
      if (current) submitGuess(lat, lon, current);
      return current;
    });
  }, [submitGuess]);

  const nextQuestion = () => {
    setPendingTap(null);
    setSelectedMultiplier(null);
    setLastAnswer(null);
    if (qIndex + 1 >= questions.length) {
      const finalTotal = answers.reduce((sum, a) => sum + a.score, 0);
      const result: DayResult = { date: dateKey, answers, total: finalTotal };
      saveResult(result);
      const wasYesterday = stats.lastPlayedDate === yesterdayKey(dateKey);
      const newStreak = wasYesterday ? stats.streak + 1 : 1;
      const newStats: Stats = {
        played: stats.played + 1,
        totalScore: stats.totalScore + finalTotal,
        bestScore: Math.max(stats.bestScore, finalTotal),
        streak: newStreak,
        bestStreak: Math.max(stats.bestStreak, newStreak),
        lastPlayedDate: dateKey,
      };
      saveStats(newStats);
      setStats(newStats);
      setPhase("done");
    } else {
      setQIndex(i => i + 1);
      setPhase("playing");
    }
  };

  const startGame = () => { setQIndex(0); setAnswers([]); setUsedMultipliers([]); setSelectedMultiplier(null); setPhase("playing"); };

  const shareText = useMemo(() => {
    const total = answers.reduce((s, a) => s + a.score, 0);
    const squares = answers.map(a => feedbackFor(a).emoji).join("");
    return `Geeokie · ${formatShareDate(dateKey)}\n${squares}\n${total} / ${ROUND_MAX}\nwww.geeokie.ok`;
  }, [answers, dateKey]);

  const smsHref = useMemo(() => `sms:&body=${encodeURIComponent(shareText)}`, [shareText]);

  const doShare = () => {
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(shareText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {});
    }
  };

  const catMeta = current ? CATEGORY_META[current.category] : null;
  const canLockIn = Boolean(pendingTap && selectedMultiplier);
  const revealFeedback = useMemo(() => lastAnswer ? feedbackFor(lastAnswer) : null, [lastAnswer]);

  return (
    <div style={{ minHeight: "100vh", maxWidth: 560, margin: "0 auto", position: "relative",
      background: "linear-gradient(180deg,#fbf3e3 0%,#f5e6c8 100%)", fontFamily: "system-ui, -apple-system, sans-serif", color: "#3a2a18" }}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .okh-fade{animation:fadeIn .35s ease both}
        button{font-family:inherit}
        .leaflet-container{background:#0e2a3d}
      `}</style>

      <header style={{ padding: "22px 20px 14px", textAlign: "center", background: "#1a3a5c", color: "#fbf3e3" }}>
        <div style={{ fontSize: 12, letterSpacing: 3, opacity: 0.75, fontWeight: 700 }}>DAILY TRIVIA</div>
        <h1 style={{ fontSize: 30, margin: "4px 0 2px", fontWeight: 800, letterSpacing: -0.5 }}>
          Gee<span style={{ color: "#e8735a" }}>okie</span>
        </h1>
        <div style={{ fontSize: 13, opacity: 0.85 }}>www.geeokie.ok — Tap the satellite map. Wager your confidence. Guess where it happened.</div>
      </header>

      {phase === "loading" && <div style={{ padding: 60, textAlign: "center" }}>Loading today&apos;s round…</div>}

      {phase === "intro" && (
        <div className="okh-fade" style={{ padding: 24, textAlign: "center" }}>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "#5a4630" }}>
            5 questions covering Oklahoma history, famous Oklahomans, fun trivia, pop culture &amp; music, and sports. Tap
            the spot on the satellite map where you think the answer is — the closer you are, the more points you score.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#5a4630", marginTop: 8 }}>
            Each question is worth <b>100 points</b>, but before you submit a guess you also pick a <b>confidence multiplier
            from ×1 to ×5</b>. Each multiplier can only be used once per round — save your ×5 for the one you&apos;re sure about.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#5a4630", marginTop: 8 }}>
            Tap the map to drop a pin, then confirm it — tap <b>Final Answer</b> or just double-tap the spot again — so a
            stray tap while you&apos;re exploring the map never accidentally submits your guess.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, margin: "14px 0", flexWrap: "wrap" }}>
            {(Object.keys(CATEGORY_META) as Category[]).map(c => (
              <span key={c} style={{ background: CATEGORY_META[c].color, color: "#fff", borderRadius: 20,
                padding: "5px 12px", fontSize: 11.5, fontWeight: 700 }}>{CATEGORY_META[c].emoji} {CATEGORY_META[c].label}</span>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 18, margin: "18px 0", fontSize: 13, color: "#7a6548" }}>
            <div><b style={{ display: "block", fontSize: 20, color: "#1a3a5c" }}>{stats.streak}</b>Day streak</div>
            <div><b style={{ display: "block", fontSize: 20, color: "#1a3a5c" }}>{stats.bestScore}</b>Best score</div>
            <div><b style={{ display: "block", fontSize: 20, color: "#1a3a5c" }}>{stats.played}</b>Played</div>
          </div>
          <button onClick={startGame} style={{ background: "#b5451f", color: "#fff", border: "none", borderRadius: 14,
            padding: "14px 36px", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(181,69,31,0.35)" }}>
            Play Today&apos;s Round
          </button>
        </div>
      )}

      {(phase === "playing" || phase === "reveal") && current && catMeta && (
        <div className="okh-fade" style={{ padding: "14px 16px 24px" }}>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 12 }}>
            {questions.map((q, i) => (
              <div key={q.id} style={{ width: 30, height: 6, borderRadius: 3,
                background: i < qIndex ? "#1a3a5c" : i === qIndex ? "#b5451f" : "#e3d3ae" }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ background: catMeta.color, color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 10.5, fontWeight: 700 }}>
              {catMeta.emoji} {catMeta.label}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#b5451f" }}>
              Q{qIndex + 1} OF {questions.length} · {BASE_POINTS} PTS BASE
            </span>
          </div>
          <p style={{ fontSize: 15.5, lineHeight: 1.55, textAlign: "center", margin: "6px 0 14px", fontWeight: 600 }}>
            {current.text}
          </p>

          <div style={{ borderRadius: 16, overflow: "hidden", border: "3px solid #1a3a5c", height: 340 }}>
            <SatelliteMap
              resetKey={qIndex}
              locked={phase === "reveal"}
              guess={pendingTap}
              actual={phase === "reveal" ? { lat: current.lat, lon: current.lon, label: current.place } : null}
              onPick={handlePick}
              onConfirm={handleDoubleClick}
            />
          </div>

          {phase === "playing" && (
            <div style={{ marginTop: 14 }}>
              <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#7a6548", marginBottom: 8 }}>
                CONFIDENCE — EACH MULTIPLIER USABLE ONCE PER ROUND
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 14 }}>
                {ALL_MULTIPLIERS.map(m => {
                  const used = usedMultipliers.includes(m);
                  const sel = selectedMultiplier === m;
                  return (
                    <button key={m} disabled={used} onClick={() => setSelectedMultiplier(m)} style={{
                      width: 48, height: 48, borderRadius: 12, border: sel ? "3px solid #b5451f" : "2px solid #d8c7a0",
                      background: used ? "#e3d3ae" : sel ? "#b5451f" : "#fff", color: used ? "#b0a482" : sel ? "#fff" : "#3a2a18",
                      fontSize: 16, fontWeight: 800, cursor: used ? "not-allowed" : "pointer",
                      textDecoration: used ? "line-through" : "none", opacity: used ? 0.6 : 1 }}>
                      ×{m}
                    </button>
                  );
                })}
              </div>
              <div style={{ textAlign: "center" }}>
                <button onClick={lockInGuess} disabled={!canLockIn} style={{
                  background: canLockIn ? "#1a3a5c" : "#ccc", color: "#fff", border: "none", borderRadius: 14,
                  padding: "13px 32px", fontSize: 15, fontWeight: 800, cursor: canLockIn ? "pointer" : "default" }}>
                  {!pendingTap ? "Tap the map to guess" : !selectedMultiplier ? "Pick a confidence multiplier" : `Final Answer (×${selectedMultiplier})`}
                </button>
                <p style={{ fontSize: 11, color: "#9a8a68", marginTop: 8 }}>
                  Tip: double-tap (or double-click) a spot on the map to confirm it as your final answer instantly.
                </p>
                <button onClick={lockInOutsideOK} disabled={!selectedMultiplier} style={{
                  background: "transparent", color: selectedMultiplier ? "#7a4a1a" : "#c4b697", border: "2px solid",
                  borderColor: selectedMultiplier ? "#7a4a1a" : "#d8c7a0", borderRadius: 14,
                  padding: "9px 20px", fontSize: 13, fontWeight: 700, marginTop: 10,
                  cursor: selectedMultiplier ? "pointer" : "default" }}>
                  🗺️ It Happened Outside of Oklahoma
                </button>
                <p style={{ fontSize: 10.5, color: "#9a8a68", marginTop: 6, maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
                  The map only covers Oklahoma — use this if you&apos;re sure the answer is somewhere else entirely (pick your multiplier first).
                </p>
              </div>
            </div>
          )}

          {phase === "reveal" && lastAnswer && revealFeedback && (
            <div className="okh-fade" style={{ marginTop: 16, textAlign: "center" }}>
              <div style={{ fontSize: 44, lineHeight: 1 }}>{revealFeedback.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#b5451f", letterSpacing: 0.5, marginTop: 4 }}>
                {revealFeedback.label}
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.5, color: "#3a2a18", fontWeight: 600, maxWidth: 420, margin: "6px auto 10px" }}>
                {revealFeedback.line}
              </p>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#1a3a5c" }}>
                +{lastAnswer.score} pts <span style={{ fontSize: 15, color: "#b5451f" }}>(×{lastAnswer.multiplier} confidence)</span>
              </div>
              <div style={{ fontSize: 13.5, color: "#7a6548", marginBottom: 6 }}>
                {lastAnswer.outsideOK
                  ? `The answer was ${current.place}, Oklahoma`
                  : `${Math.round(lastAnswer.distance)} miles from ${current.place} · raw accuracy ${lastAnswer.rawScore}/100`}
              </div>
              <p style={{ fontSize: 13, color: "#5a4630", lineHeight: 1.5, maxWidth: 420, margin: "0 auto 14px" }}>💡 {current.fact}</p>
              <button onClick={nextQuestion} style={{ background: "#b5451f", color: "#fff", border: "none", borderRadius: 14,
                padding: "12px 30px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
                {qIndex + 1 >= questions.length ? "See Results" : "Next Question →"}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="okh-fade" style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#b5451f", letterSpacing: 1 }}>TODAY&apos;S SCORE</div>
          <div style={{ fontSize: 46, fontWeight: 800, color: "#1a3a5c", margin: "2px 0 10px" }}>
            {answers.reduce((s, a) => s + a.score, 0)}<span style={{ fontSize: 20, color: "#9a8a68" }}>/{ROUND_MAX}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
            {answers.map(a => (
              <div key={a.qid} style={{ fontSize: 26 }}>{feedbackFor(a).emoji}</div>
            ))}
          </div>
          <div style={{ textAlign: "left", maxWidth: 420, margin: "0 auto 18px" }}>
            {answers.map(a => {
              const q = QUESTIONS.find(q => q.id === a.qid);
              const meta = q ? CATEGORY_META[q.category] : null;
              return (
                <div key={a.qid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px",
                  background: "rgba(255,255,255,0.55)", borderRadius: 10, marginBottom: 6, fontSize: 13.5, gap: 6 }}>
                  <span>{meta?.emoji} {q?.place} <span style={{ color: "#b5451f", fontWeight: 700 }}>×{a.multiplier}</span></span>
                  <span style={{ color: "#7a6548" }}>{a.outsideOK ? "outside OK" : `${Math.round(a.distance)} mi`}</span>
                  <b style={{ color: "#1a3a5c" }}>+{a.score}</b>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 18, margin: "10px 0 20px", fontSize: 13, color: "#7a6548" }}>
            <div><b style={{ display: "block", fontSize: 18, color: "#1a3a5c" }}>{stats.streak}</b>Day streak</div>
            <div><b style={{ display: "block", fontSize: 18, color: "#1a3a5c" }}>{stats.bestScore}</b>Best score</div>
            <div><b style={{ display: "block", fontSize: 18, color: "#1a3a5c" }}>{stats.played}</b>Played</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <button onClick={doShare} style={{ background: "#1a3a5c", color: "#fff", border: "none", borderRadius: 14,
              padding: "13px 30px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              {copied ? "Copied!" : "Share Results"}
            </button>
            <a href={smsHref} style={{ background: "#b5451f", color: "#fff", borderRadius: 14,
              padding: "13px 22px", fontSize: 15, fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              💬 Text a Friend
            </a>
          </div>
          <p style={{ fontSize: 11, color: "#9a8a68", marginTop: 10, maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
            &quot;Text a Friend&quot; opens your phone&apos;s Messages app with your score pre-filled.
          </p>
          <p style={{ fontSize: 12, color: "#9a8a68", marginTop: 16 }}>Come back tomorrow for a new round.</p>
        </div>
      )}
    </div>
  );
}
