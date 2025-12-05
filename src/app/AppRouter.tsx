import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { LanguageThemeManager } from '@/components/common/LanguageThemeManager';
import { AppRoutes } from '@/router';

export const AppRouter: React.FC = () => {
    return (
        <>
            <LanguageThemeManager />
            <Layout>
                <AppRoutes />
            </Layout>
        </>
    );
};
