import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CourseArt from './CourseArt.jsx';

const course = { category: 'Gen AI', icon: 'brain', badge: 'New' };

describe('CourseArt', () => {
  it('tags the art with the course category so CSS can tint it, and shows the badge', () => {
    const { container } = render(<CourseArt course={course} />);
    const art = container.querySelector('.course-card__art');

    expect(art).toHaveAttribute('data-category', 'Gen AI');
    expect(art).not.toHaveClass('course-card__art--compact');
    expect(screen.getByText('New')).toHaveClass('tag', 'tag--new');
    expect(container.querySelector('svg')).toHaveAttribute('width', '28');
  });

  it('uses the smaller layout when compact', () => {
    const { container } = render(<CourseArt course={course} compact />);
    expect(container.querySelector('.course-card__art')).toHaveClass('course-card__art--compact');
    expect(container.querySelector('svg')).toHaveAttribute('width', '24');
  });

  it('leaves the badge out when the course has none', () => {
    render(<CourseArt course={{ ...course, badge: null }} />);
    expect(screen.queryByText('New')).not.toBeInTheDocument();
  });
});
