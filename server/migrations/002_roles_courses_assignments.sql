-- Roles for the after-login dashboards, plus the course and assignment tables they read and write
-- (see specs/AfterLogin.md). Existing accounts become students.

ALTER TABLE registrations
  ADD COLUMN role TEXT NOT NULL DEFAULT 'student'
  CONSTRAINT registrations_role_check CHECK (role IN ('student', 'faculty', 'director'));

-- course_id is an id from server/courses.js; the catalog itself lives in code.
CREATE TABLE enrollments (
  student_id BIGINT NOT NULL REFERENCES registrations (id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, course_id)
);

CREATE TABLE assignments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_date DATE,
  created_by BIGINT REFERENCES registrations (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assignment_completions (
  assignment_id BIGINT NOT NULL REFERENCES assignments (id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES registrations (id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (assignment_id, student_id)
);
