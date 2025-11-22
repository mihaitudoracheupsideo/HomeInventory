import { useEffect } from 'react';
import { usePageTitle } from '../contexts/PageTitleContext';

const About = () => {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Despre");
  }, [setTitle]);

  return <h1 className="text-2xl font-semibold">Welcome to About</h1>
}

export default About