import { render, screen } from '@testing-library/react';
import App from './App';

test('renders main hero heading correctly', () => {
  render(<App />);
  const headerElement = screen.getByText(/Reliable Service Experts/i);
  expect(headerElement).toBeInTheDocument();
});
