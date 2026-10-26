import {useAuth} from '../components/AuthContext';
import NotFoundContent from '../components/NotFoundContent';
import HomepageQuickChips from '../components/HomepageQuickChips';
export default function NotFoundPage(){const {branding}=useAuth();return <NotFoundContent><HomepageQuickChips chips={branding.homepageChips}/></NotFoundContent>;}
