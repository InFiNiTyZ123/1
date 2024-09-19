// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract whitelist {
    mapping(address => bool) public nameList;
    address public admin;

    // Struct for employee details
    struct Employee {
        uint256 salary;
        uint256 unlockTime;
        bool isEmployed;
    }

    // Mapping to store employee details by address
    mapping(address => Employee) public employees;
    // Array to store all employee addresses
    address[] public employeeAddresses;

    event AddedToWhitelist(address indexed account);
    event RemovedFromWhitelist(address indexed account);
    event SalaryAssigned(address indexed employee, uint256 amount, uint256 unlockTime);
    event SalaryWithdrawn(address indexed employee, uint256 amount);
    event SalaryModified(address indexed employee, uint256 newAmount, uint256 newUnlockTime);
    event SalaryCancelled(address indexed employee);

    constructor() {
        admin = msg.sender; // The contract deployer is the admin
        nameList[admin]=true;
    }
    
    // Modifier to restrict functions to the admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    //for withdraw purpose
    modifier onlyWhitelisted(address account) {
        require(nameList[account], "Address is not whitelisted");
        _;
    }

    // Function to add an address to the whitelist
    function addToList(address _address) public onlyAdmin(){
        nameList[_address] = true;
    }
    //Function to remove from whitelist
    function removeFromList(address _account) public onlyAdmin {
        nameList[_account] = false;
        emit RemovedFromWhitelist(_account);
    }
    // Function to check if an address is whitelisted
    function inTheList(address _address) public view returns (bool) {
        return nameList[_address];
    }
    // Function to change the admin
    function changeAdmin(address _newAdmin) public onlyAdmin {
        admin = _newAdmin;
    }
    // Function to check if an address is the admin
    function isAdmin(address _account) public view returns (bool) {
        return _account == admin;
    }
    //Function to get address of admin, for testing purpose
    function getAdmin() public view returns (address) {
        return admin;
    }


    //emplyee
    // Function to check if an address is in the whitelist
    function isWhitelisted(address _address) public view returns (bool) {
        return nameList[_address];
    }

    //features
    // Assign salary with TimeLock
    function assignSalary(address employee, uint256 amount, uint256 lockDuration) public payable onlyAdmin onlyWhitelisted(employee) {
        require(block.timestamp >= employees[employee].unlockTime, "Cannot assign new salary while the previous one is still locked");
        //require(msg.value == amount, "Ether sent must match the salary amount");

        employees[employee].salary = amount;
        employees[employee].unlockTime = block.timestamp + lockDuration;
        emit SalaryAssigned(employee, amount, block.timestamp + lockDuration);
    }

    // Modify salary and TimeLock before the TimeLock ends
    function modifySalary(address employee, uint256 newAmount, uint256 newLockDuration) public payable onlyAdmin onlyWhitelisted(employee) {
        require(block.timestamp < employees[employee].unlockTime, "Cannot modify after TimeLock ended");
            
        employees[employee].salary = newAmount;
        employees[employee].unlockTime = block.timestamp + newLockDuration;
        emit SalaryModified(employee, newAmount, block.timestamp + newLockDuration);   
    }

    // Cancel the salary assignment before TimeLock ends
    function cancelSalary(address employee) public onlyAdmin onlyWhitelisted(employee) {
        require(block.timestamp < employees[employee].unlockTime, "Cannot cancel after TimeLock ended");

        employees[employee].salary = 0;
        employees[employee].unlockTime = 0;
        emit SalaryCancelled(employee);
    }

    //Admin withdraws the cancelled salary balance from the contract
    function withdrawContractBalance() public onlyAdmin {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No balance available for withdrawal");

        // Transfer the entire balance to the admin
        payable(admin).transfer(contractBalance);
    }

    // Employee withdraws salary after TimeLock ends
    function withdrawSalary() public onlyWhitelisted(msg.sender) {
        require(employees[msg.sender].salary > 0, "No salary assigned");
        require(block.timestamp >= employees[msg.sender].unlockTime, "TimeLock still active");

        uint256 amount = employees[msg.sender].salary;
        employees[msg.sender].salary = 0; // Reset salary to avoid re-entrancy

        payable(msg.sender).transfer(amount);
        emit SalaryWithdrawn(msg.sender, amount);
    }

    // Function to add a new employee address (modify your existing addEmployee function or similar)
    function addEmployee(address _employeeAddress) public onlyAdmin {
        require(!employees[_employeeAddress].isEmployed, "Employee already exists");

        // Add employee to the mapping (assuming you already have a mapping for employees)
        employees[_employeeAddress] = Employee({
            salary: 0,
            unlockTime: 0,
            isEmployed: true
        });

        // Add the new employee address to the array
        employeeAddresses.push(_employeeAddress);

        // Whitelist the employee address
        nameList[_employeeAddress] = true;
    }

    // Function to retrieve all employee addresses
    function getAllEmployeeAddresses() public view returns (address[] memory) {
        return employeeAddresses;
    }

    // Function to retrieve salary details for all employees
    function getAllSalaryDetails() public view returns (address[] memory, uint256[] memory, uint256[] memory, bool[] memory) {
        uint256 employeeCount = employeeAddresses.length;
        
        // Create arrays to hold employee details
        address[] memory addresses = new address[](employeeCount);
        uint256[] memory salary = new uint256[](employeeCount);
        uint256[] memory unlockTimes = new uint256[](employeeCount);
        bool[] memory isEmployedArray = new bool[](employeeCount);

        // Loop through each employee and populate the arrays
        for (uint256 i = 0; i < employeeCount; i++) {
            address employeeAddress = employeeAddresses[i];
            Employee storage employee = employees[employeeAddress];

            addresses[i] = employeeAddress;
            salary[i] = employee.salary;
            unlockTimes[i] = employee.unlockTime;
            isEmployedArray[i] = employee.isEmployed;
        }

        // Return the arrays containing employee addresses, salaries, unlock times, and employment status
        return (addresses, salary, unlockTimes, isEmployedArray);
    }
    
    // Function to remove an employee
    function removeEmployee(address _employeeAddress) public onlyAdmin {
        require(employees[_employeeAddress].isEmployed, "Employee does not exist");

        // Remove employee from the mapping
        employees[_employeeAddress].isEmployed = false; // Mark employee as not employed
        employees[_employeeAddress].salary = 0;         // Optionally clear their salary
        employees[_employeeAddress].unlockTime = 0;     // Optionally reset unlock time

        // Remove the employee address from the employeeAddresses array
        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            if (employeeAddresses[i] == _employeeAddress) {
                // Swap the employee to remove with the last employee
                employeeAddresses[i] = employeeAddresses[employeeAddresses.length - 1];
                employeeAddresses.pop(); // Remove the last element
                break;
            }
        }

        // Optionally, remove from whitelist
        nameList[_employeeAddress] = false;
    }

    // Optional: Completely delete the employee from the mapping
    function deleteEmployee(address _employeeAddress) public onlyAdmin {
        delete employees[_employeeAddress];
    }
    
    // Fallback function to accept employer deposits
    receive() external payable {}

    //retrieve employee salary data
    function getEmployeeSalary(address employeeAddress) public view returns (uint256) {
        return employees[employeeAddress].salary;
    }

    //retrieve employee timelock data
    function getEmployeeUnlockTime(address employeeAddress) public view returns (uint256) {
        return employees[employeeAddress].unlockTime;
    }

    function getContractBalance() public view returns (uint256) {
    return address(this).balance;
}
}
