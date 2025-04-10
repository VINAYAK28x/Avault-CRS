// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CrimeReport {
    struct Report {
        uint256 id;
        string title;
        string description;
        string location;
        string reportType;
        string[] evidenceHashes;
        uint256 timestamp;
        address reporter;
    }

    mapping(uint256 => Report) private reports;
    mapping(address => uint256[]) private userReports;
    uint256 private reportCounter;

    event ReportSubmitted(uint256 indexed reportId, address indexed reporter);
    event ReportStatusUpdated(uint256 indexed id, string status);

    constructor() {
        reportCounter = 0;
    }

    function submitReport(
        string memory _title,
        string memory _description,
        string memory _location,
        string memory _reportType,
        string[] memory _evidenceHashes,
        uint256 _timestamp
    ) public returns (uint256) {
        reportCounter++;
        uint256 reportId = reportCounter;

        reports[reportId] = Report({
            id: reportId,
            title: _title,
            description: _description,
            location: _location,
            reportType: _reportType,
            evidenceHashes: _evidenceHashes,
            timestamp: _timestamp,
            reporter: msg.sender
        });

        userReports[msg.sender].push(reportId);
        emit ReportSubmitted(reportId, msg.sender);
        return reportId;
    }

    function getReport(uint256 _reportId) public view returns (Report memory) {
        require(_reportId > 0 && _reportId <= reportCounter, "Invalid report ID");
        return reports[_reportId];
    }

    function getUserReports(address _user) public view returns (uint256[] memory) {
        return userReports[_user];
    }

    function getTotalReports() public view returns (uint256) {
        return reportCounter;
    }

    function updateReportStatus(
        uint256 _reportId,
        string memory _status
    ) public {
        require(_reportId > 0 && _reportId <= reportCounter, "Invalid report ID");
        emit ReportStatusUpdated(_reportId, _status);
    }
} 