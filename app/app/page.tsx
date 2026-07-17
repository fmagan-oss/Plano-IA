import CatPilotApp from '../components/CatPilotApp';

export const metadata = {
  title: 'Application — CatPilot',
};

// M2 will protect this route: unauthenticated visitors get redirected to the
// magic-link sign-in. For M1 the app is open so the flow can be demoed.
export default function AppPage() {
  return <CatPilotApp />;
}
