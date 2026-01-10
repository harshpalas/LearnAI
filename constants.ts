import { ChartBar, BookOpen, BrainCircuit, GraduationCap, LayoutDashboard, FileText, UploadCloud, LogOut } from 'lucide-react';

export const APP_NAME = "LearnAI";

export const ROUTES = {
  LANDING: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  DOCUMENTS: '/documents',
  STUDY: '/study/:id',
};

export const MENU_ITEMS = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'My Documents', path: ROUTES.DOCUMENTS, icon: FileText },
];