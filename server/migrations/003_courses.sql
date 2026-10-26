-- Moves the course catalog out of code and into Postgres, adds 10 Gen AI and Agentic AI courses,
-- and makes enrollments and assignments point at real courses (see specs/CourseTable.md).

CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  instructor TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL CONSTRAINT courses_level_check CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  duration TEXT NOT NULL,
  badge TEXT CONSTRAINT courses_badge_check CHECK (badge IN ('New', 'Popular')),
  -- Name of an icon in client/src/components/Icon.jsx.
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The original catalog, dated a month back so the new AI courses list first as the latest.
INSERT INTO courses (id, title, description, instructor, category, level, duration, badge, icon, created_at) VALUES
  ('mern-zero-to-shipped', 'MERN: Zero to Shipped', 'Build and deploy a full MongoDB, Express, React and Node app.', 'Priya Raman', 'Web Development', 'Beginner', '6h 40m', 'Popular', 'layers', now() - interval '30 days'),
  ('react-patterns', 'React Patterns, No BS', 'Hooks, composition and state patterns that hold up in real apps.', 'Marcus Lee', 'Web Development', 'Intermediate', '4h 15m', 'New', 'code', now() - interval '30 days'),
  ('figma-to-frontend', 'Figma to Front-end in a Weekend', 'Turn a Figma file into a responsive, accessible front end.', 'Ana Souza', 'UI/UX', 'Beginner', '3h 30m', 'Popular', 'pen', now() - interval '30 days'),
  ('mongodb-crash-course', 'MongoDB Schemas That Make Sense', 'Model documents, indexes and relationships without regrets.', 'Lena Fischer', 'Backend', 'Beginner', '2h 55m', 'New', 'database', now() - interval '30 days'),
  ('prompt-to-product', 'Prompt to Product with AI', 'Go from an idea and a prompt to a working AI feature.', 'Dev Mehta', 'Data & AI', 'Intermediate', '2h 50m', 'New', 'cpu', now() - interval '30 days'),
  ('docker-cloud', 'Ship to the Cloud with Docker', 'Containerize an app and deploy it to the cloud.', 'Tomás Rivera', 'Cloud & DevOps', 'Intermediate', '4h 40m', 'Popular', 'cloud', now() - interval '30 days'),
  ('design-systems', 'Design Systems That Scale', 'Tokens, components and docs that a whole team can share.', 'Jonah Kim', 'UI/UX', 'Advanced', '5h 05m', 'Popular', 'sparkles', now() - interval '30 days'),
  ('react-native', 'React Native: Pocket-Sized Apps', 'Ship an iOS and Android app from one React codebase.', 'Aisha Bello', 'Mobile', 'Advanced', '5h 20m', 'New', 'smartphone', now() - interval '30 days');

INSERT INTO courses (id, title, description, instructor, category, level, duration, badge, icon) VALUES
  ('genai-foundations', 'Generative AI Foundations', 'How large language models work: tokens, context windows, sampling and where they fail.', 'Nadia Okafor', 'Gen AI', 'Beginner', '3h 20m', 'New', 'brain'),
  ('prompt-engineering-builders', 'Prompt Engineering for Builders', 'System prompts, few-shot examples and structured output you can rely on in production.', 'Kenji Watanabe', 'Gen AI', 'Beginner', '2h 45m', 'Popular', 'messageSquare'),
  ('rag-chat-with-your-data', 'RAG: Chat with Your Own Data', 'Embeddings, vector search and retrieval-augmented generation over your own documents.', 'Sofia Marchetti', 'Gen AI', 'Intermediate', '4h 10m', 'Popular', 'fileSearch'),
  ('llm-evals', 'LLM Evals That Catch Regressions', 'Build eval sets and graders so prompt and model changes never ship blind.', 'Arjun Nair', 'Gen AI', 'Intermediate', '2h 30m', 'New', 'gauge'),
  ('fine-tune-open-llms', 'Fine-Tuning Open-Weight LLMs', 'LoRA fine-tuning, dataset prep and when fine-tuning beats prompting.', 'Hannah Schultz', 'Gen AI', 'Advanced', '5h 15m', 'New', 'sliders'),
  ('agents-tool-use', 'Build AI Agents with Tool Use', 'Give a model tools, run the agent loop and handle errors, retries and stop conditions.', 'Diego Alvarez', 'Agentic AI', 'Intermediate', '4h 30m', 'Popular', 'bot'),
  ('mcp-servers', 'Model Context Protocol: Ship MCP Servers', 'Expose your APIs and data to AI agents through the Model Context Protocol.', 'Mei Lin', 'Agentic AI', 'Intermediate', '3h 05m', 'New', 'plug'),
  ('multi-agent-orchestration', 'Multi-Agent Systems & Orchestration', 'Planner, worker and reviewer agents that split up and check each other''s work.', 'Samuel Adeyemi', 'Agentic AI', 'Advanced', '5h 40m', 'New', 'network'),
  ('coding-agents', 'Coding Agents in Your Dev Workflow', 'Pair with AI coding agents to plan, edit, test and review real codebases.', 'Elena Petrova', 'Agentic AI', 'Intermediate', '3h 15m', 'New', 'terminal'),
  ('agent-guardrails', 'Guardrails & Safety for Agentic AI', 'Permissions, human-in-the-loop checks and prompt-injection defenses for agents.', 'Omar Haddad', 'Agentic AI', 'Advanced', '3h 50m', 'New', 'shield');

ALTER TABLE enrollments
  ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses (id) ON UPDATE CASCADE;

ALTER TABLE assignments
  ADD CONSTRAINT assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses (id) ON UPDATE CASCADE;
