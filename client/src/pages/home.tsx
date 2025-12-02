import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Hammer, Zap, Database, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full space-y-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <Hammer className="w-12 h-12 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold">METATIMS BUILDER</h1>
        </div>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          A professional construction planning tool with 3D visualization, material calculations, and project management. Design, estimate, and manage your building projects all in one place.
        </p>

        <div className="grid md:grid-cols-2 gap-4 my-12">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <Zap className="w-8 h-8 text-primary mb-2" />
              <CardTitle>3D Visualization</CardTitle>
              <CardDescription>Real-time 3D preview with ridge and hipped roof options</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <Database className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Data Persistence</CardTitle>
              <CardDescription>Save and load your projects with full history</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Material Estimates</CardTitle>
              <CardDescription>Automatic calculations for materials and costs</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <Hammer className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Full Control</CardTitle>
              <CardDescription>Add walls, openings, dimensions, and cabinets with sliders</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/projects">
            <Button size="lg" className="gap-2">
              <Hammer className="w-5 h-5" />
              Start Building
            </Button>
          </Link>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-2 pt-8">
          <p>💡 Built with React, Three.js, and Express</p>
          <p>🚀 Full-stack construction planning application</p>
        </div>
      </div>
    </div>
  );
}
