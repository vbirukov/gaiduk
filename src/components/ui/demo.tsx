/**
 * Пример использования shadcn/ui компонентов с Tailwind CSS
 * 
 * Этот файл демонстрирует как использовать новые компоненты.
 * Можно удалить после ознакомления.
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function ShadcnDemo() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">shadcn/ui Components Demo</h2>
      
      {/* Buttons */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Buttons</h3>
        <div className="flex gap-2 flex-wrap">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      {/* Card */}
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Example Card</CardTitle>
          <CardDescription>This is a card component from shadcn/ui</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Card content goes here. You can use Tailwind classes alongside shadcn components.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button>Deploy</Button>
        </CardFooter>
      </Card>

      {/* Tailwind utilities */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Tailwind Utilities</h3>
        <div className="p-4 bg-primary text-primary-foreground rounded-lg">
          Primary background with Tailwind
        </div>
        <div className="p-4 bg-secondary text-secondary-foreground rounded-lg mt-2">
          Secondary background with Tailwind
        </div>
      </div>
    </div>
  )
}
