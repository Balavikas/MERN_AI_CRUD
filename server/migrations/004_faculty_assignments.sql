-- Which faculty teach which courses (see specs/AssignFaculty.md). A director assigns them, and a faculty member can
-- only post assignments for courses listed here against their id. A course can have several faculty and a faculty
-- member several courses. That faculty_id belongs to a faculty account is checked by the API.

CREATE TABLE faculty_assignments (
  faculty_id BIGINT NOT NULL REFERENCES registrations (id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses (id) ON UPDATE CASCADE ON DELETE CASCADE,
  assigned_by BIGINT REFERENCES registrations (id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (faculty_id, course_id)
);

CREATE INDEX faculty_assignments_course_id_idx ON faculty_assignments (course_id);
