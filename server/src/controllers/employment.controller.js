const employmentService = require("../services/employment.service");

exports.getMyActiveEmployments = async (req, res, next) => {
  try {
    const records = await employmentService.getActiveEmployments(req.user.id);
    res.json({ success: true, data: records.map((record) => ({
      id: record.id, company_id: record.company_id, company: record.company,
      department: record.department, position: record.position,
      employment_type: record.employment_type, status: record.status,
    })) });
  } catch (error) { next(error); }
};
