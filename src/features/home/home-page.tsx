// ============================================
// Home/Landing Page Component
// Explains OSIG purpose, features, and how it works
// ============================================

'use client';

import {
    ShieldCheckIcon,
    MagnifyingGlassIcon,
    ChartBarIcon,
    LockClosedIcon,
    BoltIcon,
    GlobeAltIcon,
    UserGroupIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
    {
        icon: MagnifyingGlassIcon,
        title: 'Deep Intelligence Gathering',
        description: 'Scan emails, usernames, domains, and phone numbers across public databases and sources.',
    },
    {
        icon: ChartBarIcon,
        title: 'Relationship Mapping',
        description: 'Visualize connections between entities with interactive graphs showing data relationships.',
    },
    {
        icon: LockClosedIcon,
        title: 'Privacy-First Approach',
        description: 'All data comes from publicly available sources. No illegal access or data breaches.',
    },
    {
        icon: BoltIcon,
        title: 'Fast & Efficient',
        description: 'Quick scans and deep scans available. Get results in minutes, not hours.',
    },
    {
        icon: DocumentTextIcon,
        title: 'Professional Reports',
        description: 'Generate comprehensive PDF and JSON reports for documentation and sharing.',
    },
    {
        icon: UserGroupIcon,
        title: 'Multi-Source Aggregation',
        description: 'Combines data from multiple public sources for comprehensive intelligence.',
    },
];

const howItWorks = [
    {
        step: '1',
        title: 'Select Target  Type',
        description: 'Choose what you want to scan: email, username domain, or phone number.',
    },
    {
        step: '2',
        title: 'Enter Target Value',
        description: 'Provide the specific email, username, domain, or phone to investigate.',
    },
    {
        step: '3',
        title: 'Choose Scan Depth',
        description: 'Quick scan for basic info or deep scan for comprehensive intelligence.',
    },
    {
        step: '4',
        title: 'Review Results',
        description: 'Explore findings, view relationship graphs, and generate reports.',
    },
];

export function HomePage() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 px-4 md:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 mb-6">
                        <ShieldCheckIcon className="h-12 w-12 text-primary" />
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">OSIG</h1>
                    </div>
                    <p className="text-xl md:text-2xl text-muted-foreground mb-4">
                        Open Source Intelligence Gathering
                    </p>
                    <p className="text-lg max-w-2xl mx-auto mb-8 text-muted-foreground">
                        Discover publicly available information about emails, usernames, domains, and phone numbers
                        using ethical OSINT techniques.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" onClick={() => window.location.hash = '#/register'}>
                            Get Started Free
                        </Button>
                        <Button size="lg" variant="outline" onClick={() => window.location.hash = '#/login'}>
                            Sign In
                        </Button>
                    </div>
                    <div className="mt-8">
                        <Badge variant="secondary" className="text-sm">
                            100% Public Data • Privacy-First • No Data Breaches
                        </Badge>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 px-4 md:px-6 lg:px-8 bg-muted/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Everything you need for professional open source intelligence gathering
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                                    <CardHeader>
                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                            <Icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-base">
                                            {feature.description}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-16 px-4 md:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
                        <p className="text-lg text-muted-foreground">
                            Simple, transparent, and effective intelligence gathering
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {howItWorks.map((item, index) => (
                            <div key={index} className="relative">
                                <div className="flex flex-col items-center text-center">
                                    <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4">
                                        {item.step}
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                                {index < howItWorks.length - 1 && (
                                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-border -translate-x-1/2" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Legal & Privacy Section */}
            <section className="py-16 px-4 md:px-6 lg:px-8 bg-muted/30">
                <div className="max-w-4xl mx-auto">
                    <Card className="border-2">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <LockClosedIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">Legal & Ethical</CardTitle>
                                    <CardDescription className="text-base">
                                        Committed to responsible intelligence gathering
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <GlobeAltIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium mb-1">Public Data Only</p>
                                    <p className="text-sm text-muted-foreground">
                                        OSIG uses only publicly available and legally accessible information from legitimate sources.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <ShieldCheckIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium mb-1">No Data Breaches</p>
                                    <p className="text-sm text-muted-foreground">
                                        We never access, use, or promote any illegally obtained or breached data.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <UserGroupIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium mb-1">Legitimate Use Only</p>
                                    <p className="text-sm text-muted-foreground">
                                        Users must confirm they have a legitimate purpose before running scans.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 md:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Ready to Start Gathering Intelligence?
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8">
                        Join thousands of researchers, investigators, and security professionals using OSIG.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" onClick={() => window.location.hash = '#/register'}>
                            Create Free Account
                        </Button>
                        <Button size="lg" variant="outline" onClick={() => window.location.hash = '#/login'}>
                            Sign In
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
