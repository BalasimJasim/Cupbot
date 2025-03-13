import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import SettingsPage from '../page';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create a new QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Wrapper component with providers
function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('SettingsPage', () => {
  const mockSettings = {
    notifications: {
      email: true,
      telegram: false,
      bookings: true,
      orders: true,
      marketing: false,
    },
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      telegramId: '@johndoe',
    },
  };

  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: mockSettings });
    mockedAxios.patch.mockResolvedValue({ data: mockSettings });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    renderWithClient(<SettingsPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders settings form with data', async () => {
    renderWithClient(<SettingsPage />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    // Check if profile information is rendered
    expect(screen.getByLabelText('First name')).toHaveValue('John');
    expect(screen.getByLabelText('Last name')).toHaveValue('Doe');
    expect(screen.getByLabelText('Email address')).toHaveValue('john@example.com');
    expect(screen.getByLabelText('Telegram ID')).toHaveValue('@johndoe');

    // Check if notification switches are rendered
    expect(screen.getByText('Email notifications')).toBeInTheDocument();
    expect(screen.getByText('Telegram notifications')).toBeInTheDocument();
    expect(screen.getByText('Booking updates')).toBeInTheDocument();
    expect(screen.getByText('Order updates')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
  });

  it('handles profile form submission', async () => {
    renderWithClient(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    // Update form fields
    await act(async () => {
      fireEvent.change(screen.getByLabelText('First name'), {
        target: { value: 'Jane' },
      });
      fireEvent.change(screen.getByLabelText('Last name'), {
        target: { value: 'Smith' },
      });
    });

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByText('Save changes'));
    });

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith('/api/settings', {
        ...mockSettings,
        profile: {
          ...mockSettings.profile,
          firstName: 'Jane',
          lastName: 'Smith',
        },
      });
    });
  });

  it('handles notification toggle', async () => {
    renderWithClient(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    // Find and click email notifications switch
    const emailSwitch = screen.getByRole('switch', { name: 'Email notifications' });
    
    await act(async () => {
      fireEvent.click(emailSwitch);
    });

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith('/api/settings', {
        ...mockSettings,
        notifications: {
          ...mockSettings.notifications,
          email: false,
        },
      });
    });
  });
}); 