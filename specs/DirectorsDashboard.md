Create a **Grouped Bar Chart** in the directors tab on the top of Course assignments to visualize candidate counts by education level, comparing Students and Faculty.

### Chart Title
**Candidates by Education Level**

### Education Categories
- Bootcamp
- High School
- Self-taught
- Undergrad
- Postgrad

### Requirements
1. Display a grouped bar chart with two bars per education category:
   - Students
   - Faculty

2. **X-axis:** Education levels.
   
   **Y-axis:** Number of candidates, starting at zero.

3. Use two visually distinct, professional colors:
   - Students: Blue
   - Faculty: Purple

4. Add a legend to identify Students and Faculty.

5. Display tooltips on hover showing:
   - Education level
   - Candidate type (Student or Faculty)
   - Exact candidate count

6. Display a clear chart title and axis labels.

7. Use responsive sizing so the chart looks good on desktop, tablet, and mobile.

8. Match the existing dashboard's design system, including typography, spacing, colors, and background.

9. Use actual candidate data from the application's database or existing API. Aggregate the records by education level and candidate type. Do not hardcode sample counts in production.

10. Handle missing categories by displaying a count of zero. Include loading, empty, and error states.

11. If appropriate, provide filters for:
    - All Candidates
    - Students Only
    - Faculty Only

12. Ensure the chart is accessible, with readable labels, appropriate color contrast, and a useful alternative for screen readers.

### Expected Result
A clean, modern dashboard chart that allows users to compare student and faculty candidate counts across all five education categories at a glance.

Before implementing, inspect the existing project structure and identify the charting library already in use. Reuse existing components and dependencies where possible. If no charting library exists, recommend a suitable library and implement the chart using it.

Keep the implementation modular, maintainable, and consistent with the existing application architecture.
