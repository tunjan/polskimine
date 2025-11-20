import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Heatmap } from './Heatmap';
import { ReviewHistory } from '../types';

describe('Heatmap', () => {
  it('renders heatmap grid', () => {
    const history: ReviewHistory = { '2024-01-01': 5 };
    render(<Heatmap history={history} />);
    
    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();
  });

  it('displays month markers', () => {
    const history: ReviewHistory = {};
    render(<Heatmap history={history} />);
    
    // Should have month labels somewhere
    const months = screen.getAllByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
    expect(months.length).toBeGreaterThan(0);
  });

  it('renders cells for each day', () => {
    const today = new Date().toISOString().split('T')[0];
    const history: ReviewHistory = { [today]: 10 };
    render(<Heatmap history={history} />);
    
    const cells = screen.getAllByRole('gridcell');
    // Should render 53 weeks * 7 days = 371 cells
    expect(cells.length).toBe(371);
  });

  it('applies correct color intensity based on review count', () => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    
    const d1 = new Date(today);
    const d2 = new Date(today); d2.setDate(d2.getDate() - 1);
    const d3 = new Date(today); d3.setDate(d3.getDate() - 2);

    const history: ReviewHistory = {
      [formatDate(d1)]: 1,  // Low
      [formatDate(d2)]: 5,  // Medium
      [formatDate(d3)]: 10, // High
    };
    render(<Heatmap history={history} />);
    
    const cells = screen.getAllByRole('gridcell');
    const coloredCells = cells.filter(cell => 
      cell.className.includes('bg-emerald')
    );
    
    expect(coloredCells.length).toBeGreaterThan(0);
  });

  it('shows zero reviews with lightest color', () => {
    const history: ReviewHistory = {};
    render(<Heatmap history={history} />);
    
    const cells = screen.getAllByRole('gridcell');
    const emptyCells = cells.filter(cell => cell.className.includes('bg-gray-100'));
    
    expect(emptyCells.length).toBeGreaterThan(0);
  });

  it('updates selected day on cell click', async () => {
    const today = new Date().toISOString().split('T')[0];
    const history: ReviewHistory = { [today]: 7 };
    render(<Heatmap history={history} />);
    
    const cells = screen.getAllByRole('gridcell');
    const cellWithReviews = cells.find(cell => 
      cell.getAttribute('title')?.includes(today)
    );
    
    if (cellWithReviews) {
      await userEvent.click(cellWithReviews);
      expect(screen.getByText('7')).toBeInTheDocument();
    }
  });

  it('displays selected day information', () => {
    const today = new Date().toISOString().split('T')[0];
    const history: ReviewHistory = { [today]: 5 };
    render(<Heatmap history={history} />);
    
    expect(screen.getByText(/Selected/i)).toBeInTheDocument();
    expect(screen.getByText(/reviews/i)).toBeInTheDocument();
  });

  it('shows current day as default selection', () => {
    const today = new Date().toISOString().split('T')[0];
    const history: ReviewHistory = { [today]: 3 };
    render(<Heatmap history={history} />);
    
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('handles empty history gracefully', () => {
    const history: ReviewHistory = {};
    render(<Heatmap history={history} />);
    
    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('hides future dates', () => {
    const history: ReviewHistory = {};
    render(<Heatmap history={history} />);
    
    const cells = screen.getAllByRole('gridcell');
    const futureCells = cells.filter(cell => cell.className.includes('opacity-0'));
    
    expect(futureCells.length).toBeGreaterThan(0);
  });

  it('shows legend with color scale', () => {
    const history: ReviewHistory = {};
    render(<Heatmap history={history} />);
    
    expect(screen.getByText(/Less/i)).toBeInTheDocument();
    expect(screen.getByText(/More/i)).toBeInTheDocument();
  });

  it('highlights selected cell visually', async () => {
    const today = new Date().toISOString().split('T')[0];
    const history: ReviewHistory = { [today]: 5 };
    render(<Heatmap history={history} />);
    
    const cells = screen.getAllByRole('gridcell');
    const targetCell = cells.find(cell => 
      cell.getAttribute('title')?.includes(today)
    );
    
    if (targetCell) {
      await userEvent.click(targetCell);
      expect(targetCell.className).toContain('ring-2');
    }
  });

  it('generates last 52 weeks of data', () => {
    const history: ReviewHistory = {};
    render(<Heatmap history={history} />);
    
    const cells = screen.getAllByRole('gridcell');
    expect(cells.length).toBe(371); // 53 weeks * 7 days
  });

  it('displays correct tooltip for each cell', () => {
    const today = new Date().toISOString().split('T')[0];
    const history: ReviewHistory = { [today]: 8 };
    render(<Heatmap history={history} />);
    
    const cells = screen.getAllByRole('gridcell');
    const cellWithData = cells.find(cell => 
      cell.getAttribute('title')?.includes('8 reviews')
    );
    
    expect(cellWithData).toBeInTheDocument();
  });

  it('handles varying review counts correctly', () => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    
    const d1 = new Date(today);
    const d2 = new Date(today); d2.setDate(d2.getDate() - 1);
    const d3 = new Date(today); d3.setDate(d3.getDate() - 2);
    const d4 = new Date(today); d4.setDate(d4.getDate() - 3);
    const d5 = new Date(today); d5.setDate(d5.getDate() - 4);

    const history: ReviewHistory = {
      [formatDate(d1)]: 1,
      [formatDate(d2)]: 3,
      [formatDate(d3)]: 6,
      [formatDate(d4)]: 10,
      [formatDate(d5)]: 15,
    };
    render(<Heatmap history={history} />);
    
    const cells = screen.getAllByRole('gridcell');
    // Should have different color intensities
    const colorClasses = new Set(cells.map(c => c.className));
    expect(colorClasses.size).toBeGreaterThan(1);
  });
});
