import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Sparkles, Wand2 } from "lucide-react"
import {
  Button,
  Badge,
  Chip,
  SegmentControl,
  ToggleSwitch,
  Stepper,
  Slider,
  PromptInput,
  CharacterCard,
  HistoryCard,
  SettingsCard,
  TabBar,
  HeaderBrand,
  HeaderBack,
  FlowCard,
  UploadZone,
  ComparisonSlider,
  RecentImageCard,
  TextDivider,
} from "~/components/ui"

export const Route = createFileRoute("/dev")({
  component: DevPage,
})

function DevPage() {
  const [segmentValue, setSegmentValue] = React.useState("option1")
  const [toggleValue, setToggleValue] = React.useState("a")
  const [stepperValue, setStepperValue] = React.useState(3)
  const [sliderValue, setSliderValue] = React.useState(25)
  const [promptValue, setPromptValue] = React.useState("")
  const [activeTab, setActiveTab] = React.useState<"home" | "flows" | "history" | "profile">("home")

  return (
    <div className="min-h-screen bg-[#FAF9F7] pb-24">
      <HeaderBrand />

      <div className="px-6 flex flex-col gap-10 mt-4">

        {/* Buttons */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold text-[#9C9B99] uppercase tracking-wider font-[Outfit]">Buttons</h2>
          <Button variant="primary">Generate Image</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="add">+ Add</Button>
        </section>

        {/* Badges */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold text-[#9C9B99] uppercase tracking-wider font-[Outfit]">Badges</h2>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="green">Active</Badge>
            <Badge variant="white">v1.2.0</Badge>
            <Badge variant="status">Running</Badge>
          </div>
        </section>

        {/* Chips */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold text-[#9C9B99] uppercase tracking-wider font-[Outfit]">Chips</h2>
          <div className="flex gap-2 flex-wrap">
            <Chip variant="active">Landscape</Chip>
            <Chip variant="inactive">Portrait</Chip>
            <Chip variant="inactive">Square</Chip>
          </div>
        </section>

        {/* Segment Control */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold text-[#9C9B99] uppercase tracking-wider font-[Outfit]">Segment Control</h2>
          <SegmentControl
            options={[
              { label: "Standard", value: "option1" },
              { label: "HD", value: "option2" },
              { label: "4K", value: "option3" },
            ]}
            value={segmentValue}
            onChange={setSegmentValue}
          />
        </section>

        {/* Toggle Switch */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold text-[#9C9B99] uppercase tracking-wider font-[Outfit]">Toggle Switch</h2>
          <ToggleSwitch
            options={[
              { label: "Text", value: "a" },
              { label: "Image", value: "b" },
            ]}
            value={toggleValue}
            onChange={setToggleValue}
          />
        </section>

        {/* Stepper */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold text-[#9C9B99] uppercase tracking-wider font-[Outfit]">Stepper</h2>
          <Stepper value={stepperValue} onChange={setStepperValue} min={1} max={10} />
        </section>

        {/* Slider */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold text-[#9C9B99] uppercase tracking-wider font-[Outfit]">Slider</h2>
          <Slider label="Steps" value={sliderValue} onChange={setSliderValue} min={10} max={50} />
        </section>

        {/* Prompt Input */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold text-[#9C9B99] uppercase tracking-wider font-[Outfit]">Prompt Input</h2>
          <PromptInput value={promptValue} onChange={setPromptValue} />
        </section>

        {/* Character Card */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold text-[#9C9B99] uppercase tracking-wider font-[Outfit]">Character Card</h2>
          <div className="grid grid-cols-2 gap-3">
            <CharacterCard name="Anime Girl" description="Colorful anime style with vibrant backgrounds" />
            <CharacterCard name="Realistic" description="Photorealistic portrait style" />
          </div>
        </section>

        {/* History Card */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold text-[#9C9B99] uppercase tracking-wider font-[Outfit]">History Card</h2>
          <HistoryCard
            title="Mountain sunset landscape"
            subtitle="2 min ago · 4 images"
            badges={
              <>
                <Badge variant="green">Done</Badge>
                <Badge variant="white">SD 1.5</Badge>
              </>
            }
          />
        </section>

        {/* Settings Card */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold text-[#9C9B99] uppercase tracking-wider font-[Outfit]">Settings Card</h2>
          <SettingsCard
            rows={[
              { label: "Model", value: "SD 1.5" },
              { label: "Sampler", value: "DPM++ 2M" },
              { label: "Resolution", value: "512×512" },
              { label: "CFG Scale", value: "7" },
            ]}
          />
        </section>

        {/* Header Back */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold text-[#9C9B99] uppercase tracking-wider font-[Outfit]">Header Back</h2>
          <div className="bg-white rounded-xl overflow-hidden">
            <HeaderBack title="Generate" />
          </div>
        </section>

        {/* Flow Card */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold text-[#9C9B99] uppercase tracking-wider font-[Outfit]">Flow Card</h2>
          <FlowCard
            title="Text to Image"
            description="Generate images from text prompts"
            icon={Sparkles}
          />
          <FlowCard
            title="Image to Image"
            description="Transform existing images with AI"
            icon={Wand2}
            imageSrc="https://picsum.photos/seed/flow/400/200"
          />
        </section>

        {/* Upload Zone */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold text-[#9C9B99] uppercase tracking-wider font-[Outfit]">Upload Zone</h2>
          <UploadZone />
        </section>

        {/* Comparison Slider */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold text-[#9C9B99] uppercase tracking-wider font-[Outfit]">Comparison Slider</h2>
          <ComparisonSlider
            beforeSrc="https://picsum.photos/seed/before/400/300"
            afterSrc="https://picsum.photos/seed/after/400/300"
            className="h-[260px]"
          />
        </section>

        {/* Recent Image Card */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold text-[#9C9B99] uppercase tracking-wider font-[Outfit]">Recent Image Card</h2>
          <RecentImageCard
            name="Sunset landscape"
            info="2 min ago · 512×512"
            thumbnailSrc="https://picsum.photos/seed/recent1/112/112"
          />
          <RecentImageCard
            name="Portrait study"
            info="15 min ago · 768×768"
          />
        </section>

        {/* Text Divider */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold text-[#9C9B99] uppercase tracking-wider font-[Outfit]">Text Divider</h2>
          <TextDivider />
          <TextDivider label="or continue with" />
        </section>

      </div>

      {/* Tab Bar fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  )
}
