const PDFDocument = require('pdfkit');

function generateStudentReport(user, progressList, stream) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(stream);

  // Color Palette
  const primaryColor = '#4f46e5'; // Premium Indigo
  const textColor = '#1f2937'; // Dark Slate
  const bodyColor = '#4b5563'; // Muted Gray
  const borderLight = '#e5e7eb'; // Border Gray
  const tableHeaderBg = '#f9fafb'; // Table Header Fill
  
  // Header Accent Box
  doc.rect(0, 0, 595.28, 120).fill(primaryColor);
  
  // Report Title
  doc.fillColor('#ffffff')
     .font('Helvetica-Bold')
     .fontSize(22)
     .text('STUDENT PERFORMANCE REPORT', 50, 40);

  doc.fontSize(11)
     .font('Helvetica')
     .text('DSA Levels Progress & MCQ Test Records', 50, 70);

  // Profile Card Header
  doc.fillColor(textColor)
     .font('Helvetica-Bold')
     .fontSize(14)
     .text('Student Profile', 50, 150);

  // Profile Card Border
  doc.rect(50, 170, 495.28, 85).strokeColor(borderLight).lineWidth(1).stroke();

  // Profile Details
  doc.fontSize(10).font('Helvetica-Bold').fillColor(textColor);
  doc.text('Student Name:', 70, 185);
  doc.text('Email Address:', 70, 205);
  doc.text('Subject Course:', 70, 225);

  doc.font('Helvetica').fillColor(bodyColor);
  doc.text(user.username || 'N/A', 160, 185);
  doc.text(user.email || 'N/A', 160, 205);
  doc.text('Data Structures & Algorithms (DSA)', 160, 225);

  // Score stats on the right side of profile
  doc.font('Helvetica-Bold').fillColor(textColor);
  doc.text('Levels Completed:', 340, 185);
  doc.text('Total Marks:', 340, 205);
  
  // Calculate completed levels and total scaled score
  // Each MCQ has 20 questions (each 1 mark). We scale each level score to be out of 10 marks,
  // so 10 levels * 10 marks = 100 marks total.
  // Scaled Score = score / 2.
  const completedCount = progressList.filter(p => p.status === 'completed').length;
  let totalScoreScaled = 0;
  progressList.forEach(p => {
    if (p.status === 'completed') {
      const totalQ = p.totalQuestions || 10; // default fallback
      totalScoreScaled += (p.score / totalQ) * 10;
    }
  });

  doc.font('Helvetica').fillColor(bodyColor);
  doc.text(`${completedCount} / 10 Levels`, 440, 185);
  doc.font('Helvetica-Bold').fillColor(primaryColor);
  doc.text(`${totalScoreScaled.toFixed(1)} / 100.0`, 440, 205);

  // Table Title
  doc.fillColor(textColor)
     .font('Helvetica-Bold')
     .fontSize(14)
     .text('Level-wise Progress Details', 50, 280);

  // Table Headers
  const tableTop = 305;
  const colLevelLeft = 60;
  const colStatusLeft = 160;
  const colRawScoreLeft = 280;
  const colScaledScoreLeft = 400;

  doc.rect(50, tableTop, 495.28, 25).fill(tableHeaderBg);
  doc.rect(50, tableTop, 495.28, 25).strokeColor(borderLight).stroke();

  doc.fontSize(9).font('Helvetica-Bold').fillColor(textColor);
  doc.text('Level', colLevelLeft, tableTop + 8);
  doc.text('Status', colStatusLeft, tableTop + 8);
  doc.text('Raw Score', colRawScoreLeft, tableTop + 8);
  doc.text('Weighted Marks (Out of 10)', colScaledScoreLeft, tableTop + 8);

  // Populate Levels 1 to 10
  let currentY = tableTop + 25;
  const rowHeight = 22;

  for (let lvl = 1; lvl <= 10; lvl++) {
    const lvlProgress = progressList.find(p => p.level === lvl);
    
    // Draw row background for alternating levels for neatness
    if (lvl % 2 === 0) {
      doc.rect(50, currentY, 495.28, rowHeight).fill('#f9fafb');
    }
    doc.rect(50, currentY, 495.28, rowHeight).strokeColor(borderLight).stroke();

    doc.fontSize(9).font('Helvetica').fillColor(textColor);
    doc.text(`Level ${lvl}`, colLevelLeft, currentY + 7);

    // Status formatting
    let statusText = 'Locked';
    let statusColor = '#9ca3af'; // Gray
    let rawScoreText = '-';
    let scaledScoreText = '-';

    if (lvlProgress) {
      if (lvlProgress.status === 'completed') {
        statusText = 'Completed';
        statusColor = '#10b981'; // Green
        const totalQ = lvlProgress.totalQuestions || 10;
        rawScoreText = `${lvlProgress.score} / ${totalQ}`;
        scaledScoreText = `${((lvlProgress.score / totalQ) * 10).toFixed(1)} / 10`;
      } else if (lvlProgress.status === 'unlocked') {
        statusText = 'Unlocked';
        statusColor = '#f59e0b'; // Amber
      }
    } else if (lvl === 1) {
      statusText = 'Unlocked';
      statusColor = '#f59e0b';
    }

    doc.font('Helvetica-Bold').fillColor(statusColor).text(statusText, colStatusLeft, currentY + 7);
    doc.font('Helvetica').fillColor(bodyColor).text(rawScoreText, colRawScoreLeft, currentY + 7);
    doc.text(scaledScoreText, colScaledScoreLeft, currentY + 7);

    currentY += rowHeight;
  }

  // Footer / Certificate of Achievement style note
  const footerTop = currentY + 30;
  doc.rect(50, footerTop, 495.28, 60).fill('#f5f3ff');
  doc.rect(50, footerTop, 495.28, 60).strokeColor('#c084fc').lineWidth(1).stroke();

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#6b21a8');
  doc.text('Performance Summary & Next Steps:', 70, footerTop + 15);
  
  let suggestion = 'Complete Level 1 to unlock subsequent levels.';
  if (completedCount > 0) {
    const avgScore = (totalScoreScaled / completedCount) * 10;
    suggestion = `Average score is ${avgScore.toFixed(1)}%. Continue to complete other levels.`;
  }
  doc.font('Helvetica').fillColor('#581c87');
  doc.text(`Current completion is ${((completedCount / 10) * 100).toFixed(0)}%. ${suggestion}`, 70, footerTop + 32);

  // Bottom Branding
  doc.fontSize(8).fillColor('#9ca3af');
  doc.text('Generated automatically by MCQ Test Portal', 50, 750, { align: 'center', width: 495 });

  doc.end();
}

module.exports = {
  generateStudentReport
};
