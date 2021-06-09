	//**************************************************************************
	// URL LIST
	//**************************************************************************

let BASE_URL = "https://api.coingecko.com/api/v3";
let  COINS = "/coins/list";
let ListOfCoinsUrl = BASE_URL + COINS;
let EXCHANGES = "/exchanges";
let ListOfExchangesURL = BASE_URL + EXCHANGES;
let MARKETS = "/coins/markets";
let ListOfMarketsURL = BASE_URL + MARKETS;
let BITCOIN = "/coins/markets?vs_currency=usd&ids=bitcoin&order=market_cap_desc&per_page=100&page=1&sparkline=false";
let BitcoinURL = BASE_URL + BITCOIN;
let ETHEREUM = "/coins/markets?vs_currency=usd&ids=ethereum&order=market_cap_desc&per_page=100&page=1&sparkline=false";
let EthereumURL = BASE_URL + ETHEREUM;
let API_KEY = config.ETHERSCAN_API_KEY;
let EtherscanURL = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${API_KEY}`;

$(document).ready(async function() {
	
	//**************************************************************************
	// START FETCHING AND DISPLAYING MARKET INFO
	//**************************************************************************

	// Get list of coins and display number of coins on webpage
	
	var coins =	await fetchListOfCoins();
	$("#coins a").append(coins.length);
	
	// Get list of exchanges and display number of exchanges on webpage
	
	var exchanges =	await getEntireExchangesList();
	$("#exchanges a").append(exchanges.length);
	
	// Get list of markets and display total market cap on webpage
	
	var markets = await getEntireMarketsList();
	console.log("Market cap for market[0] is " + markets[0].market_cap);
	var totalMarketCapNumber = 0;
	for (i = 0; i < markets.length; i++) {
			totalMarketCapNumber += markets[i].market_cap;
	}
	var totalMarketCap = Math.round(totalMarketCapNumber);
	totalMarketCap = totalMarketCap.toLocaleString();
	console.log("Total market cap is: " + totalMarketCap);
	$("#market-cap > a:first-of-type").append("$" + totalMarketCap);
	
	// Calculate total 24 hour volume and display number it on webpage
	
	var totalVolume = 0;
	for (i = 0; i < markets.length; i++) {
			totalVolume += markets[i].total_volume;
	}
	totalVolume = Math.round(totalVolume);
	totalVolume = totalVolume.toLocaleString();
	$("#24h-vol a").append("$" + totalVolume);

	// Fetch Bitcoin market info, calculate Bitcoin dominance and display it on webpage
	
	bitcoinMarkets = await getBitcoinInfo();
	var bitcoinMarketCap = bitcoinMarkets[0].market_cap;
	console.log(bitcoinMarketCap);
	var bitcoinDominance = bitcoinMarketCap * 100 / totalMarketCapNumber;
	bitcoinDominance = Math.round(bitcoinDominance * 10) / 10;
	console.log("Bitcoin dominance is: " + bitcoinDominance + "%");
	$("#btcd").append("BTC " + bitcoinDominance + "%");
	
	// Fetch Ethereum market info, calculate Ethereum dominance and display it on webpage
	
	ethereumMarkets = await getEthereumInfo();
	var ethereumMarketCap = ethereumMarkets[0].market_cap;
	console.log(ethereumMarketCap);
	var ethereumDominance = ethereumMarketCap * 100 / totalMarketCapNumber;
	ethereumDominance = Math.round(ethereumDominance * 10) / 10;
	console.log("Ethereum dominance is: " + ethereumDominance + "%");
	$("#ethd").append("ETH " + ethereumDominance + "%");
	
	// Fetch gas fees and display them on webpage
	
	gasInfo = await getEtherscanGasOracle();
	console.log("Gas fees are: " + gasInfo.SafeGasPrice);
	$("#ethgas").append(gasInfo.ProposeGasPrice + " gwei");
	
	// Eth Gas Fees Tooltip
	
	$('#eth-gas').tooltip({title:`Fast:${gasInfo.FastGasPrice} Standard:${gasInfo.ProposeGasPrice} Safe:${gasInfo.SafeGasPrice} Data by Etherscan`})
	
	// Calculate Total Market Cap 24 Hour Change
	
	let totalMarketCapChange24H = 0;
	for (i = 0; i < markets.length; i++) {
			totalMarketCapChange24H += markets[i].market_cap_change_24h;
	}
	console.log("Total Market Cap 24h Change is " + totalMarketCapChange24H);
	
	// Calculate yesterday's total market cap
	
	let yesterdaysTotalMarketCapNumber = 0;
	yesterdaysTotalMarketCapNumber = totalMarketCapNumber - totalMarketCapChange24H;
	
	// Calculate what percentage the total market cap change in the last 24 hours is from yesterday's total market cap
	
	let totalMarketCapPercentageChange24H = 0;
	totalMarketCapPercentageChange24H = totalMarketCapChange24H * 100 / yesterdaysTotalMarketCapNumber;
	totalMarketCapPercentageChange24H = Math.round(totalMarketCapPercentageChange24H * 10) / 10;
	console.log("The percentage change in total market cap in the last 24 hours is: " + totalMarketCapPercentageChange24H + "%");
	
	if (totalMarketCapPercentageChange24H >= 0) {
		$("#market-cap a:last-child").addClass("text-green");
	}
	else {
		$("#market-cap a:last-child").addClass("text-danger");
	}
	
	$("#market-cap a:last-child").append(totalMarketCapPercentageChange24H + "%");
	
	//**************************************************************************
	// END FETCHING AND DISPLAYING MARKET INFO
	//**************************************************************************
	
	//**************************************************************************
	// START FETCHING AND DISPLAYING COINS TABLE
	//**************************************************************************
	
	let page = 1
	createTable(page);
	
	//prev button: decrease page by one, refill table with new data
    $(".prev-button").click(async function() {
        //if already at page 1, refresh table and end function
        if(page == 1){
            await createTable(page);
            return;
        }
        page--;
        await createTable(page); 
    });
	
	 //next button: increase page by one, refill table with new data
	
    $(".next-button").click(async function() {
        page++;
        await createTable(page); 
    });
	
	async function createTable(_page){
        //get all data from api
        let pageMarkets = await getMarkets(_page, 100);
        //built table with api data result
        displayCoinInfoInColumns(pageMarkets);
    }
	
	
	function displayCoinInfoInColumns(_pageMarkets) {
		$('tr.content-row').remove();
		for (i=0; i < _pageMarkets.length; i++) {
			let oneHourPercentageChangeRounded = Math.round(_pageMarkets[i].price_change_percentage_1h_in_currency  * 10) / 10;
			let sevenDayPercentageChangeRounded = Math.round(_pageMarkets[i].price_change_percentage_7d_in_currency  * 10) / 10;
			let twentyFourHourPercentageChangeRounded = Math.round(_pageMarkets[i].market_cap_change_percentage_24h  * 10) / 10;
			let coinCounter = (page - 1) * 100 + 1 + i;
			var tr;
			tr = $('<tr class="content-row"/>');
			tr.append("<td>&nbsp;</td>");
			tr.append("<td>" +coinCounter + "</td>");
			tr.append("<td>" + _pageMarkets[i].name + "</td>");
			tr.append('<td class="uppercase">' + _pageMarkets[i].symbol + "</td>");
			tr.append('<td class="text-right">' + "$" + _pageMarkets[i].current_price.toLocaleString() + "</td>");
			tr.append('<td class="text-right">' + oneHourPercentageChangeRounded + "%" + "</td>");
			tr.append('<td class="text-right">' + twentyFourHourPercentageChangeRounded + "%" + "</td>");
			tr.append('<td class="text-right">' + sevenDayPercentageChangeRounded + "%" + "</td>");
			tr.append('<td class="text-right">' + "$" + _pageMarkets[i].total_volume.toLocaleString() + "</td>");
			tr.append('<td class="text-right">' + "$" +  _pageMarkets[i].market_cap.toLocaleString() + "</td>");
			$("tbody").append(tr);
		}
	}
	
	//**************************************************************************
	// END FETCHING AND DISPLAYING COINS TABLE
	//**************************************************************************
	
	//**************************************************************************
	// START COINS TABLE PAGINATION
	//**************************************************************************
	
	// Calculate the number of pages
	let lastPage = Math.round(coins.length / 100);
	console.log("Number of pages is: " + lastPage);
	
	// 
	
});
	
	//**************************************************************************
	// FETCHING FUNCTIONS
	//**************************************************************************

// Fetches list of coins and returns them

function fetchListOfCoins() {
    return fetch(ListOfCoinsUrl)
    .then(res => {
		 res = res.json()
        return res
    }).then(data => {
        return data
    }).catch(error => {
        console.log(error)
    })
}

// Fetches list of exchanges and returns them

function fetchListOfExchanges() {
    return fetch(ListOfExchangesURL)
    .then(res => {
		 res = res.json()
        return res
    }).then(data => {
        return data
    }).catch(error => {
        console.log(error)
    })
}

// getExchanges(): Gets all the exchange results (250 results) for a specific page (pageNo) and returns them 

const limitPerPage=250;

const getExchanges = async function(pageNo = 1) {

let actualUrl=ListOfExchangesURL + `?page=${pageNo}&per_page=${limitPerPage}`;
var apiResults=await fetch(actualUrl)
.then(res=>{
return res.json();
});

return apiResults;

}

// Recursively calls getExchanges() until it reaches a page with no results and then concatenates all of the results

const getEntireExchangesList = async function(pageNo = 1) {
  const results = await getExchanges(pageNo);
  console.log("Retreiving data from API for page : " + pageNo);
  if (results.length>0) {
    return results.concat(await getEntireExchangesList(pageNo+1));
  } else {
    return results;
  }
};

// getMarkets(): Gets all the markets results (250 results) for a specific page (pageNo) and returns them 

const getMarkets = async function(pageNo = 1, perPage= 250) {

let actualUrl=ListOfMarketsURL + `?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${pageNo}&sparkline=false&price_change_percentage=1h%2C7d`;
var apiResults=await fetch(actualUrl)
.then(res=>{
return res.json();
});

return apiResults;

}

// Recursively calls getMarkets() until it reaches a page with no results and then concatenates all of the results

const getEntireMarketsList = async function(pageNo = 1, perPage = 250) {
  const results = await getMarkets(pageNo);
  console.log("Retreiving data from API for page : " + pageNo);
  if (results.length>0) {
    return results.concat(await getEntireMarketsList(pageNo+1, perPage));
  } else {
	 return results;
  }
};

// Gets Bitcoin market information

const getBitcoinInfo = async function() {
var apiResults=await fetch(BitcoinURL)
.then(res=>{
return res.json();
});

return apiResults;

}

// Gets Ethereum market information

const getEthereumInfo = async function() {
var apiResults=await fetch(EthereumURL)
.then(res=>{
return res.json();
});
console.log(apiResults);
return apiResults;
}

// Gets Etherscan Gas Oracle information

const getEtherscanGasOracle = async function() {
var apiResults=await fetch(EtherscanURL)
.then(res=>{
return res.json();
});
console.log(/*"Etherscan Gas Oracle results: " + */apiResults);
console.log("Ethereum Safe Gas Price " + apiResults.result.SafeGasPrice);
console.log("Ethereum Standard Gas Price " + apiResults.result.ProposeGasPrice);
console.log("Ethereum Fast Gas Price " + apiResults.result.FastGasPrice);
return apiResults.result;
}