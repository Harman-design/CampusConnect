/**
 * Compares a student's profile against a placement's eligibility criteria.
 * Returns { isEligible, reasons } where reasons lists every unmet criterion.
 */
function checkEligibility(user, placement) {
  const reasons = [];
  const { eligibility } = placement;

  if (eligibility.minCgpa > 0) {
    if (user.cgpa === null || user.cgpa === undefined) {
      reasons.push('Add your CGPA to your profile to check eligibility.');
    } else if (user.cgpa < eligibility.minCgpa) {
      reasons.push(`Minimum CGPA required is ${eligibility.minCgpa} (yours is ${user.cgpa}).`);
    }
  }

  if (eligibility.maxBacklogs < 999) {
    if ((user.backlogs ?? 0) > eligibility.maxBacklogs) {
      reasons.push(`Maximum ${eligibility.maxBacklogs} backlog(s) allowed (you have ${user.backlogs}).`);
    }
  }

  if (eligibility.allowedDepartments && eligibility.allowedDepartments.length > 0) {
    if (!eligibility.allowedDepartments.includes(user.department)) {
      reasons.push(`This drive is open to: ${eligibility.allowedDepartments.join(', ')}.`);
    }
  }

  if (eligibility.graduationYear) {
    if (user.graduationYear && user.graduationYear !== eligibility.graduationYear) {
      reasons.push(`This drive is open to the ${eligibility.graduationYear} graduating batch only.`);
    }
  }

  return { isEligible: reasons.length === 0, reasons };
}

module.exports = { checkEligibility };
