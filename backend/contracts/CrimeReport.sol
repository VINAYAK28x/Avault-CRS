// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CrimeReport {
    struct Report {
        uint256 id;
        string title;
        string reportType;
        string description;
        string location;
        string[] evidenceHashes;
        uint256 timestamp;
        address reporter;
        string status;
    }

    Report[] public reports;
    mapping(address => uint256[]) public userReports;
    uint256 private reportCounter;

    event ReportSubmitted(uint256 indexed id, address indexed reporter, string title);
    event ReportStatusUpdated(uint256 indexed id, string status);

    constructor() {
        reportCounter = 0;
    }

    function submitReport(
        string memory _title,
        string memory _reportType,
        string memory _description,
        string memory _location,
        string[] memory _evidenceHashes,
        uint256 _timestamp
    ) public returns (uint256) {
        uint256 reportId = reportCounter++;
        
        Report memory newReport = Report({
            id: reportId,
            title: _title,
            reportType: _reportType,
            description: _description,
            location: _location,
            evidenceHashes: _evidenceHashes,
            timestamp: _timestamp,
            reporter: msg.sender,
            status: "Pending"
        });

        reports.push(newReport);
        userReports[msg.sender].push(reportId);

        emit ReportSubmitted(reportId, msg.sender, _title);
        return reportId;
    }

    function updateReportStatus(uint256 _reportId, string memory _status) public {
        require(_reportId < reports.length, "Report does not exist");
        require(msg.sender == reports[_reportId].reporter, "Not authorized");
        
        reports[_reportId].status = _status;
        emit ReportStatusUpdated(_reportId, _status);
    }

    function getReport(uint256 _reportId) public view returns (
        uint256 id,
        string memory title,
        string memory reportType,
        string memory description,
        string memory location,
        string[] memory evidenceHashes,
        uint256 timestamp,
        address reporter,
        string memory status
    ) {
        require(_reportId < reports.length, "Report does not exist");
        Report memory report = reports[_reportId];
        return (
            report.id,
            report.title,
            report.reportType,
            report.description,
            report.location,
            report.evidenceHashes,
            report.timestamp,
            report.reporter,
            report.status
        );
    }

    function getUserReports(address _user) public view returns (uint256[] memory) {
        return userReports[_user];
    }

    function getReportCount() public view returns (uint256) {
        return reports.length;
    }
} 