import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SettingsRoute } from './SettingsRoute';
import { SettingsLayout } from '../components/SettingsLayout';

import { vi } from 'vitest';

// Mock the child components to avoid full rendering complexity
vi.mock('../components/GeneralSettings', () => ({
    GeneralSettings: () => <div data-testid="general-settings">General Settings Page</div>
}));
vi.mock('../components/AudioSettings', () => ({
    AudioSettings: () => <div data-testid="audio-settings">Audio Settings Page</div>
}));
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'test-user' } })
}));
vi.mock('@/features/profile/hooks/useProfile', () => ({
    useProfile: () => ({
        profile: { username: 'testuser', language_level: 'A1' },
        updateUsername: vi.fn(),
        updateLanguageLevel: vi.fn()
    })
}));
// Mock store
vi.mock('@/stores/useSettingsStore', () => ({
    useSettingsStore: (selector: any) => {
        const state = {
            settings: { language: 'polish', tts: {}, fsrs: {} },
            setSettings: vi.fn(),
            updateSettings: vi.fn(),
            saveApiKeys: vi.fn(),
        };
        return selector ? selector(state) : state;
    }
}));

describe('Settings Navigation', () => {
    test('renders layout and navigates between tabs', () => {
        render(
            <MemoryRouter initialEntries={['/settings/general']}>
                <Routes>
                    <Route path="/settings/*" element={<SettingsRoute />} />
                </Routes>
            </MemoryRouter>
        );

        // Check if layout is present
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByTestId('general-settings')).toBeInTheDocument();

        // Find Audio tab and click
        const audioTab = screen.getByText('Audio');
        fireEvent.click(audioTab);

        // tailored check: In the bug scenario, the layout might disappear
        // or we might navigate to /audio which is 404/empty in this isolated test

        // Expect layout to still be there
        expect(screen.getByText('Settings')).toBeInTheDocument();
        // Expect audio page
        expect(screen.getByTestId('audio-settings')).toBeInTheDocument();
    });
});
