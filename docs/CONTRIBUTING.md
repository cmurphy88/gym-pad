# Contributing to Gym Pad

Thank you for your interest in contributing to Gym Pad! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- PostgreSQL (for production-like testing)

### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/your-username/gym-pad.git
   cd gym-pad
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database URL
   ```

4. **Database Setup**

   ```bash
   npx prisma generate
   npx prisma db push
   node lib/seed-templates.js  # Optional: seed exercise templates
   ```

5. **Start Development Server**

   ```bash
   npm run dev
   ```

## Project Structure

```text
gym-pad/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── (pages)/        # Page components
│   └── globals.css     # Global styles
├── components/         # Reusable UI components
├── contexts/          # React contexts
├── lib/               # Utility functions and services
├── prisma/            # Database schema and migrations
├── docs/              # Documentation
├── tests/             # Test files
└── coverage/          # Test coverage reports
```

## Development Guidelines

### Code Style

We use ESLint and Prettier for code formatting. Please ensure your code follows these standards:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Component Guidelines

1. **Functional Components**: Use functional components with hooks
2. **Component Organization**: One component per file
3. **Props Validation**: Use PropTypes for prop validation
4. **Naming**: Use PascalCase for components, camelCase for functions
5. **File Structure**: Keep related files together

**Example Component:**
```jsx
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function ExerciseItem({ exercise, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Component logic
  }, [exercise]);

  return (
    <div className="exercise-item">
      {/* Component JSX */}
    </div>
  );
}

ExerciseItem.propTypes = {
  exercise: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default ExerciseItem;
```

### API Development

1. **RESTful Design**: Follow REST conventions
2. **Error Handling**: Consistent error responses
3. **Validation**: Server-side input validation
4. **Authentication**: Protect routes appropriately
5. **Documentation**: Update API docs for changes

**Example API Route:**
```javascript
import { NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth';
import { validateWorkout } from '@/lib/validations';

export async function POST(request) {
  try {
    const user = await validateAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateWorkout(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Process request
    const workout = await createWorkout(user.id, body);
    
    return NextResponse.json({ workout });
  } catch (error) {
    console.error('Workout creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Database Changes

1. **Migrations**: Use Prisma migrations for schema changes
2. **Backwards Compatibility**: Ensure migrations don't break existing data
3. **Testing**: Test migrations on sample data
4. **Documentation**: Update database documentation

**Creating a Migration:**
```bash
# Create and apply migration
npx prisma migrate dev --name descriptive_migration_name

# Generate client after schema changes
npx prisma generate
```

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database operations
- **E2E Tests**: Test complete user workflows

**Example Test:**
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExerciseItem from '@/components/ExerciseItem';

describe('ExerciseItem', () => {
  const mockExercise = {
    id: 1,
    name: 'Bench Press',
    setsData: '[{"reps":10,"weight":135}]',
  };

  it('renders exercise name correctly', () => {
    render(<ExerciseItem exercise={mockExercise} onUpdate={vi.fn()} />);
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('calls onUpdate when modified', () => {
    const mockOnUpdate = vi.fn();
    render(<ExerciseItem exercise={mockExercise} onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Save'));
    
    expect(mockOnUpdate).toHaveBeenCalled();
  });
});
```

## Commit Guidelines

### Commit Message Format
```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(workouts): add workout template functionality

Add ability to create and use workout templates for faster workout creation.
Includes template CRUD operations and workout generation from templates.

Closes #123

fix(auth): resolve session timeout issue

Fix issue where user sessions were expiring prematurely due to incorrect
token expiration logic.

Fixes #456
```

## Pull Request Process

### Before Submitting
1. **Test**: Ensure all tests pass
2. **Lint**: Fix any linting issues
3. **Documentation**: Update relevant documentation
4. **Rebase**: Rebase on latest main branch

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No merge conflicts

## Screenshots (if applicable)
Add screenshots for UI changes
```

### Review Process
1. **Automated Checks**: Ensure CI passes
2. **Code Review**: Address reviewer feedback
3. **Testing**: Verify functionality works as expected
4. **Documentation**: Confirm docs are updated
5. **Approval**: Get approval from maintainers

## Issue Reporting

### Bug Reports
Use the bug report template and include:
- **Environment**: OS, browser, version
- **Steps to Reproduce**: Clear reproduction steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: Visual evidence if applicable

### Feature Requests
Use the feature request template and include:
- **Problem**: What problem does this solve?
- **Solution**: Proposed solution
- **Alternatives**: Alternative solutions considered
- **Additional Context**: Any other relevant information

## Development Workflow

### Branching Strategy
- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: Feature development branches
- **hotfix/**: Critical bug fixes

### Workflow Steps
1. **Create Branch**: `git checkout -b feature/new-feature`
2. **Develop**: Make changes and commit
3. **Test**: Run tests and ensure they pass
4. **Push**: Push branch to origin
5. **PR**: Create pull request
6. **Review**: Address feedback
7. **Merge**: Merge after approval

## Documentation

### Updating Documentation
- **API Changes**: Update `docs/API.md`
- **Database Changes**: Update `docs/DATABASE.md`
- **Architecture Changes**: Update `docs/ARCHITECTURE.md`
- **Deployment Changes**: Update `docs/DEPLOYMENT.md`

### Writing Guidelines
- **Clear**: Use clear, concise language
- **Examples**: Include code examples
- **Structure**: Use consistent formatting
- **Links**: Link to relevant sections

## Community Guidelines

### Code of Conduct
- **Respectful**: Be respectful to all contributors
- **Inclusive**: Welcome newcomers and diverse perspectives
- **Constructive**: Provide constructive feedback
- **Professional**: Maintain professional communication

### Getting Help
- **Issues**: Create an issue for bugs or questions
- **Discussions**: Use GitHub discussions for general questions
- **Documentation**: Check existing documentation first

## Recognition

Contributors are recognized in several ways:
- **Contributors**: Listed in repository contributors
- **Changelog**: Mentioned in release notes
- **Documentation**: Credited in relevant documentation

Thank you for contributing to Gym Pad!
