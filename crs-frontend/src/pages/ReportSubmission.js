import React from "react";
import ReportForm from "../pages/ReportForm";

const ReportSubmission = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center mb-4">Submit a Crime Report</h1>
        <ReportForm />
      </div>
    </div>
  );
};

export default ReportSubmission;
