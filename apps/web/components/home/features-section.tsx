import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface Feature {
  icon: string;
  title: string;
  description: string;
  content: string;
}

const features: Feature[] = [
  {
    icon: '🔐',
    title: 'Secure Storage',
    description: 'Your API keys are encrypted and stored securely',
    content: 'We use industry-standard encryption to protect your sensitive API credentials.',
  },
  {
    icon: '🚀',
    title: 'Easy Management',
    description: 'Simple dashboard to manage all your keys',
    content: 'Update your OpenAI and Trading212 API keys with just a few clicks.',
  },
];

export default function FeaturesSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
      {features.map((feature, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>
              {feature.icon} {feature.title}
            </CardTitle>
            <CardDescription>{feature.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{feature.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
