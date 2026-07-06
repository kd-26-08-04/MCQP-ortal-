import React, { useState, useEffect } from 'react';
import { Book, ChevronRight, Award, GraduationCap } from 'lucide-react';

export default function Courses({ onSelectSubject, token, apiUrl }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${apiUrl}/api/courses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch courses');
        return res.json();
      })
      .then(data => {
        setCourses(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [apiUrl, token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading available courses...</div>
      </div>
    );
  }

  if (error) {
    return <div className="alert-message error">{error}</div>;
  }

  return (
    <div className="fade-in">
      <div className="welcome-header">
        <h1 className="welcome-title">Welcome to Assessment Portal</h1>
        <p className="welcome-subtitle">Select your course path and unlock stages by passing level tests.</p>
      </div>

      <h2 className="section-title">
        <GraduationCap size={22} style={{ color: 'hsl(var(--primary))' }} />
        Available Academic Courses
      </h2>

      <div className="courses-grid">
        {courses.map((course) => (
          <div key={course.id} className="course-card">
            <div className="course-icon">
              <Book size={24} />
            </div>
            <h3 className="course-name">{course.name}</h3>
            <p className="course-desc">
              Complete subject assessment sets. Solve 20 questions in 20 minutes for each level. Earn at least 50% (10 marks) to unlock the next level.
            </p>

            <div className="subjects-list">
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Select Subject Track
              </div>
              {course.subjects.map((subj) => (
                <div
                  key={subj.id}
                  className="subject-item"
                  onClick={() => onSelectSubject(subj.id, subj.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Award size={18} style={{ color: 'hsl(var(--primary))' }} />
                    <span>{subj.name}</span>
                  </div>
                  <ChevronRight size={16} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
