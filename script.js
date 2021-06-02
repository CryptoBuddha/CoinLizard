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

const getMarkets = async function(pageNo = 1) {

let actualUrl=ListOfMarketsURL + `?vs_currency=usd&order=market_cap_desc&per_page=250&page=${pageNo}&sparkline=false`;
var apiResults=await fetch(actualUrl)
.then(res=>{
return res.json();
});

return apiResults;

}

// Recursively calls getMarkets() until it reaches a page with no results and then concatenates all of the results

const getEntireMarketsList = async function(pageNo = 1) {
  const results = await getMarkets(pageNo);
  console.log("Retreiving data from API for page : " + pageNo);
  if (results.length>0) {
    return results.concat(await getEntireMarketsList(pageNo+1));
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