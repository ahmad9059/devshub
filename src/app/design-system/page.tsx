import {
  BellIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  Code2Icon,
  CopyIcon,
  PlusIcon,
} from "lucide-react";

import { ThemeToggle } from "~/components/theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Switch } from "~/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export const metadata = {
  title: "Design System",
  description:
    "The shared visual language and component reference for DevsHub.",
};

export default function DesignSystemPage() {
  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Code2Icon className="size-4" aria-hidden="true" />
            <span className="text-sm font-semibold">DevsHub</span>
            <Separator orientation="vertical" className="mx-1 h-4" />
            <span className="text-muted-foreground text-sm">Design System</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <section className="max-w-3xl">
          <Badge variant="outline" className="mb-4">
            Version 1.0
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            One language for every DevsHub experience.
          </h1>
          <p className="text-muted-foreground mt-4 text-lg leading-8">
            A neutral, accessible system built from shadcn/ui primitives and
            semantic tokens. Dark mode is the default; every component has
            complete light and system support.
          </p>
        </section>

        <Separator className="my-12" />

        <Tabs defaultValue="foundations" className="gap-8">
          <TabsList variant="line">
            <TabsTrigger value="foundations">Foundations</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
          </TabsList>

          <TabsContent value="foundations" className="space-y-12">
            <Section
              title="Color"
              description="Semantic roles adapt automatically between light and dark themes."
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <TokenCard
                  name="Background"
                  token="bg-background"
                  className="bg-background"
                />
                <TokenCard
                  name="Foreground"
                  token="bg-foreground"
                  className="bg-foreground"
                />
                <TokenCard
                  name="Primary"
                  token="bg-primary"
                  className="bg-primary"
                />
                <TokenCard
                  name="Secondary"
                  token="bg-secondary"
                  className="bg-secondary"
                />
                <TokenCard name="Muted" token="bg-muted" className="bg-muted" />
                <TokenCard
                  name="Accent"
                  token="bg-accent"
                  className="bg-accent"
                />
                <TokenCard
                  name="Destructive"
                  token="bg-destructive"
                  className="bg-destructive"
                />
                <TokenCard
                  name="Border"
                  token="bg-border"
                  className="bg-border"
                />
              </div>
            </Section>

            <Section
              title="Typography"
              description="Geist provides the interface voice; Geist Mono identifies code and data."
            >
              <Card>
                <CardContent className="space-y-8">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Display / 48
                    </p>
                    <p className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
                      Build with clarity.
                    </p>
                  </div>
                  <Separator />
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground text-sm">Body / 16</p>
                      <p className="mt-2 leading-7">
                        A shared visual language makes products easier to build
                        and easier to understand.
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Mono / 14</p>
                      <code className="mt-2 block font-mono text-sm">
                        const community = &quot;DevsHub&quot;;
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Section>

            <Section
              title="Radius & spacing"
              description="A compact 4px spacing rhythm and 10px base radius keep interfaces calm and consistent."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <MetricCard label="Base radius" value="10px" />
                <MetricCard label="Spacing unit" value="4px" />
                <MetricCard label="Content width" value="1152px" />
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="components" className="space-y-12">
            <Section
              title="Actions"
              description="Use one clear primary action per surface."
            >
              <Card>
                <CardContent className="flex flex-wrap items-center gap-3">
                  <Button>
                    <PlusIcon data-icon="inline-start" />
                    Create project
                  </Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Delete</Button>
                  <Button variant="link">Learn more</Button>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Copy code"
                        />
                      }
                    >
                      <CopyIcon aria-hidden="true" />
                    </TooltipTrigger>
                    <TooltipContent>Copy code</TooltipContent>
                  </Tooltip>
                  <Button disabled>Disabled</Button>
                </CardContent>
              </Card>
            </Section>

            <Section
              title="Status"
              description="Badges communicate compact metadata, not primary actions."
            >
              <Card>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </CardContent>
              </Card>
            </Section>

            <Section
              title="Inputs"
              description="Every input is paired with a visible label and supporting context."
            >
              <Card>
                <CardHeader>
                  <CardTitle>Create a profile</CardTitle>
                  <CardDescription>
                    Showcase of standard form controls and their spacing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display name</Label>
                    <Input id="display-name" placeholder="Ada Lovelace" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Primary role</Label>
                    <Select defaultValue="engineer">
                      <SelectTrigger id="role" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engineer">
                          Software engineer
                        </SelectItem>
                        <SelectItem value="designer">
                          Product designer
                        </SelectItem>
                        <SelectItem value="founder">Founder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" placeholder="What are you building?" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="updates" defaultChecked />
                    <Label htmlFor="updates">Send product updates</Label>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <Label htmlFor="public-profile">Public profile</Label>
                    <Switch id="public-profile" defaultChecked />
                  </div>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save profile</Button>
                </CardFooter>
              </Card>
            </Section>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-12">
            <Section
              title="Feedback"
              description="Pair color with iconography and direct language."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Alert>
                  <CheckCircle2Icon aria-hidden="true" />
                  <AlertTitle>Changes saved</AlertTitle>
                  <AlertDescription>
                    Your profile is visible to the community.
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <CircleAlertIcon aria-hidden="true" />
                  <AlertTitle>Unable to publish</AlertTitle>
                  <AlertDescription>
                    Review the highlighted fields and try again.
                  </AlertDescription>
                </Alert>
              </div>
            </Section>

            <Section
              title="Content card"
              description="A standard card groups one subject and its related actions."
            >
              <Card className="max-w-xl">
                <CardHeader>
                  <CardTitle>Community digest</CardTitle>
                  <CardDescription>
                    The most useful discussions, delivered weekly.
                  </CardDescription>
                  <CardAction>
                    <Badge variant="secondary">Weekly</Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>DH</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">DevsHub editorial</p>
                    <p className="text-muted-foreground text-sm">
                      12,480 developers subscribed
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="justify-between">
                  <span className="text-muted-foreground text-sm">
                    Next issue on Friday
                  </span>
                  <Button size="sm">
                    <BellIcon data-icon="inline-start" />
                    Subscribe
                  </Button>
                </CardFooter>
              </Card>
            </Section>

            <Section
              title="Data display"
              description="Tables prioritize scanning with restrained alignment and borders."
            >
              <Card>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead className="text-right">Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          API reference
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Active</Badge>
                        </TableCell>
                        <TableCell>Amal N.</TableCell>
                        <TableCell className="text-muted-foreground text-right">
                          2m ago
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Component library
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Review</Badge>
                        </TableCell>
                        <TableCell>Sam K.</TableCell>
                        <TableCell className="text-muted-foreground text-right">
                          1h ago
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Section>

            <Section
              title="Loading"
              description="Skeletons preserve layout while content is being fetched."
            >
              <Card className="max-w-md">
                <CardContent className="flex items-center gap-4">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            </Section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
      {children}
    </section>
  );
}

function TokenCard({
  name,
  token,
  className,
}: {
  name: string;
  token: string;
  className: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div
          className={`h-16 rounded-md border ${className}`}
          aria-hidden="true"
        />
        <div>
          <p className="font-medium">{name}</p>
          <code className="text-muted-foreground font-mono text-xs">
            {token}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-mono text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
