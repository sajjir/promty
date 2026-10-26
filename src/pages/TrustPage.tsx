import TrustPageContent from '../components/TrustPageContent';
import {STATIC_TRUST_PAGES,type StaticTrustPageConfig} from '../lib/trustPages';
export default function TrustPage({path}:{path:StaticTrustPageConfig['path']}) {
 return <TrustPageContent page={STATIC_TRUST_PAGES[path]}/>;
}
