import React, { useState, useEffect } from 'react';
import { Book, ChevronRight, Award, GraduationCap } from 'lucide-react';
import { apiFetch } from '../api';

export default function Courses({ onSelectSubject, token }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    apiFetch('/api/courses', { token })
      .then(({ data }) => {
        if (cancelled) return;
        setCourses(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return <div className="state-block" role="status">Loading courses…</div>;
  }

  if (error) {
    return <div className="alert-message error" role="alert">{error}</div>;
  }

  return (
    <div className="fade-in">
      <header className="welcome-header">
        <p className="eyebrow">Assessment path</p>
        <h1 className="welcome-title">Choose your course</h1>
        <p className="welcome-subtitle">
          Unlock stages by passing each level test. Score at least 50% to advance.
        </p>
      </header>

      <h2 className="section-title">
        <GraduationCap size={22} aria-hidden="true" />
        Available courses
      </h2>

      <div className="courses-grid">
        {courses.map((course) => (
          <article key={course.id} className="course-card">
            <div className="course-icon" aria-hidden="true">
              <Book size={24} />
            </div>
            <h3 className="course-name">{course.name}</h3>
            <p className="course-desc">
              Timed MCQ assessments with progressive unlock. Complete each level to open the next.
            </p>

            <div className="subjects-list">
              <div className="subjects-label">Subjects</div>
              {course.subjects.map((subj) => (
                <button
                  key={subj.id}
                  type="button"
                  className="subject-item"
                  onClick={() => onSelectSubject(subj.id, subj.name)}
                >
                  <span className="subject-item-left">
                    <Award size={18} aria-hidden="true" />
                    <span>{subj.name}</span>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
