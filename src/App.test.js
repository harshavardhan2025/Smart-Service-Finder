import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import Navbar from './components/Navbar';

describe('Global Application Shell Render Dynamics', () => {
  test('Validates dynamic DOM injection lifecycle', () => {
    render(<App />);
    // Checks overall component hierarchy loaded without top-level catch throw
    expect(document.body).toBeInTheDocument();
  });

  test('Ensures navbar brand identity rendered successfully', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    const brandElement = screen.getByText(/Workzy/i);
    expect(brandElement).toBeInTheDocument();
  });

  test('Validates availability of key navigation nodes in the view tree', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
  });
});
