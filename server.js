const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const {ethers} = require('ethers');
const app = express();
const crypto = require('crypto');
const port = 3000;
const jwt = require('jsonwebtoken');
// Whitelist contract address and ABI
const whitelistContractAddress = "0x1A2F73b93117a885b9520028D6790480322D0C61"; // Replace with your deployed contract address
const whitelistABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "AddedToWhitelist",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "RemovedFromWhitelist",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "employee",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "unlockTime",
				"type": "uint256"
			}
		],
		"name": "SalaryAssigned",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "employee",
				"type": "address"
			}
		],
		"name": "SalaryCancelled",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "employee",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "newAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "newUnlockTime",
				"type": "uint256"
			}
		],
		"name": "SalaryModified",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "employee",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "SalaryWithdrawn",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_employeeAddress",
				"type": "address"
			}
		],
		"name": "addEmployee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_address",
				"type": "address"
			}
		],
		"name": "addToList",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "admin",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "employee",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "lockDuration",
				"type": "uint256"
			}
		],
		"name": "assignSalary",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "employee",
				"type": "address"
			}
		],
		"name": "cancelSalary",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_newAdmin",
				"type": "address"
			}
		],
		"name": "changeAdmin",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_employeeAddress",
				"type": "address"
			}
		],
		"name": "deleteEmployee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "employeeAddresses",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "employees",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "salary",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "unlockTime",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isEmployed",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAdmin",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAllEmployeeAddresses",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAllSalaryDetails",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			},
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			},
			{
				"internalType": "bool[]",
				"name": "",
				"type": "bool[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "employeeAddress",
				"type": "address"
			}
		],
		"name": "getEmployeeSalary",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "employeeAddress",
				"type": "address"
			}
		],
		"name": "getEmployeeUnlockTime",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_address",
				"type": "address"
			}
		],
		"name": "inTheList",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_account",
				"type": "address"
			}
		],
		"name": "isAdmin",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_address",
				"type": "address"
			}
		],
		"name": "isWhitelisted",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "employee",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "newAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "newLockDuration",
				"type": "uint256"
			}
		],
		"name": "modifySalary",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "nameList",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_employeeAddress",
				"type": "address"
			}
		],
		"name": "removeEmployee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_account",
				"type": "address"
			}
		],
		"name": "removeFromList",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdrawContractBalance",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdrawSalary",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
];

// Connect to Ethereum provider (you can use Infura or Alchemy for mainnet/testnet)
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545'); 
const whitelistContract = new ethers.Contract(whitelistContractAddress, whitelistABI, provider);
const signer = provider.getSigner();
let account;
// Middleware for parsing JSON and handling form data
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
// Set up session management

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
}));

// Set the view engine to EJS and set the views folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (optional if you want to add CSS/JS files later)
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/employer', (req, res) => {
  res.render('employer');
});

app.get('/employee', (req, res) => {
	res.render('employee');
});

// GET route to retrieve a nonce value for use in signing
app.get('/api/nonce', (req, res) => {
  // Generate a random 32-byte value to use as the nonce
  const nonce = crypto.randomBytes(32).toString('hex');
  // Return the nonce value as a JSON object in the response body
  res.json({ nonce });
});
// Route to render the login page

app.get('/login', (req, res) => {
  res.render('login');
});
app.post('/login', async (req, res) => {
    try {
        const { account } = req.body;
        const isAdmin = await whitelistContract.isAdmin(account);
        const isEmployee = await whitelistContract.isWhitelisted(account);

        if (isAdmin) {
            req.session.account = account;
            res.status(200).json({ message: 'Success: Is an admin', role: 'admin' });
        } else if (isEmployee) {
            req.session.account = account;
            res.status(200).json({ message: 'Success: Is an employee', role: 'employee' });
        } else {
            res.status(403).json({ message: 'Login failed: Not an admin or employee' });
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to render the dashboard after login
app.get('/dashboard', (req, res) => {
  if (!req.session || !req.session.account) {  
    return res.redirect('/login'); // Redirect to login if not authenticated
  }
  res.render('dashboard', { account: req.session.account });
  
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


// app.post('/withdrawBalance', async (req, res) => {
//   try {
//       const adminAddress = '0xE1cB6D8A20317BB6b2297f07C481f87F3D227572'; // Replace with admin address
//       const tx = await whitelistContract.withdrawContractBalance();
//       await tx.wait(); // Wait for transaction confirmation
//       res.json({ success: true, message: 'Contract balance withdrawn successfully!' });
//   } catch (error) {
//       console.error("Error withdrawing balance:", error);
//       res.status(500).send("Error withdrawing balance");
//   }
// });

//newwwwwwwwwwwwwww
// const Web3 = require('web3');
// const contract = require('./build/contracts/SalaryTimeLock.json');

// const web3 = new Web3('http://localhost:8545'); // or testnet/mainnet URL
// const contractInstance = new web3.eth.Contract(contract.abi, contract.networks[networkId].address);

// // Assign salary function
// async function assignSalary(employee, amount, duration) {
//     await contractInstance.methods.assignSalary(employee, amount, duration)
//         .send({ from: employerAddress });
// }

// // Withdraw salary function
// async function withdrawSalary(employee) {
//     await contractInstance.methods.withdrawSalary()
//         .send({ from: employee });
// }
