# Stock Photo Prompt Schema Documentation

> This document describes the JSON schema used for generating customized stock photography prompts and how it integrates with the application.

---

## Overview

Our prompt system uses a modular JSON structure that separates concerns into distinct sections. This allows us to:

1. **Reuse base compositions** across different customization scenarios
2. **Layer personalization** (branding, team members) on top of base prompts
3. **Maintain consistency** across all generated images in a photo pack
4. **Programmatically assemble** final prompts based on user preferences

---

## Schema Structure

Each prompt follows this standardized JSON structure:

```json
{
  "shot_id": "string",
  "base_scene": "string",
  "camera": {
    "angle": "string",
    "distance": "string",
    "height": "string",
    "perspective": "string"
  },
  "subject": {
    "position": "string",
    "pose": "string",
    "action": "string",
    "orientation": "string"
  },
  "composition": {
    "framing": "string",
    "foreground": "string",
    "background": "string",
    "depth": "string"
  },
  "environment": {
    "home_type": "string",
    "room_style": "string",
    "lived_in_details": "string",
    "atmosphere": "string"
  },
  "branding": {
    "uniform": "string",
    "colors": "string"
  }
}
```

---

## Section Definitions

### `shot_id`
A unique identifier for each prompt following the pattern: `{TYPE}{IMAGE#}-{PANEL#}`

- **SR** = Sink Repair (e.g., `SR1-01`, `SR2-05`)
- **TR** = Toilet Repair (e.g., `TR1-01`, `TR3-09`)

This ID is used for tracking, logging, and referencing specific prompts in the system.

---

### `base_scene`
A foundational one-sentence description of the overall scenario.

**Example:**
```json
"base_scene": "A plumber working on a sink repair in the kitchen of a suburban home"
```

**Purpose:** Establishes the core context that all other details build upon.

---

### `camera`
Technical camera positioning information for the image generation model.

| Field | Description | Example Values |
|-------|-------------|----------------|
| `angle` | Camera angle relative to subject | "high angle, three-quarter view", "low angle from floor", "bird's eye view" |
| `distance` | Shot type/framing | "wide shot", "medium shot", "close-up", "extreme close-up" |
| `height` | Vertical camera position | "standing eye level", "kneeling height", "floor level" |
| `perspective` | Overall perspective description | "POV from inside cabinet", "environmental shot", "profile portrait" |

**Example:**
```json
"camera": {
  "angle": "three-quarter front view",
  "distance": "medium shot",
  "height": "standing eye level, looking down",
  "perspective": "classic work-in-progress angle"
}
```

---

### `subject`
Details about the worker/person in the scene.

| Field | Description | Example Values |
|-------|-------------|----------------|
| `position` | Physical location in the scene | "kneeling beside the toilet", "lying on back under sink" |
| `pose` | Body position and posture | "one knee down, torso leaning forward", "supine, arms raised" |
| `action` | What they're actively doing | "using wrench to tighten bolts", "inspecting pipe connections" |
| `orientation` | Direction facing relative to camera | "profile view", "back to camera", "three-quarter facing camera" |

**Example:**
```json
"subject": {
  "position": "kneeling beside the toilet on the bathroom floor",
  "pose": "one knee down, torso leaning toward toilet base, arms extended downward",
  "action": "using a wrench to tighten or loosen the bolts at the base of the toilet",
  "orientation": "three-quarter view facing the toilet"
}
```

---

### `composition`
How the visual elements are arranged in the frame.

| Field | Description | Example Values |
|-------|-------------|----------------|
| `framing` | What's included in the frame | "full body with kitchen environment", "tight crop on hands and tools" |
| `foreground` | Prominent front elements | "toolbox on floor", "hands with wrench" |
| `background` | Back elements and environment | "bathroom wall and window", "kitchen cabinets" |
| `depth` | How depth is created | "cabinet opening acts as natural frame", "shallow focus on work area" |

**Example:**
```json
"composition": {
  "framing": "full body with toilet and partial bathroom visible",
  "foreground": "toilet base and plumber's hands with wrench",
  "background": "bathroom wall and floor",
  "depth": "toilet creates middle ground interest"
}
```

---

### `environment`
Scene setting details that add realism and variety. **These should be geographically neutral** to work for businesses anywhere in the country.

| Field | Description | Example Values |
|-------|-------------|----------------|
| `home_type` | Socioeconomic/demographic context | "middle-class suburban family home", "upscale condo", "modest starter home" |
| `room_style` | Design aesthetic and specific features | "modern farmhouse with white shaker cabinets", "contemporary with floating vanity" |
| `lived_in_details` | Specific objects that make spaces feel real | "kids' artwork on fridge, fruit bowl on counter", "prescription bottles, reading glasses" |
| `atmosphere` | Overall mood and feeling | "warm, welcoming family home", "elegant, spa-like retreat" |

**Example:**
```json
"environment": {
  "home_type": "young family starter home",
  "room_style": "builder-grade white cabinets with simple hardware and basic granite counters",
  "lived_in_details": "baby bottles drying on the counter, a high chair visible at the edge of frame, colorful sippy cups",
  "atmosphere": "busy young family home with cheerful chaos"
}
```

**⚠️ Important:** Avoid geographically-specific descriptions like "beach cottage," "mountain cabin," or "lakehouse" that could make images feel out of place for businesses in different regions.

---

### `branding`
Instructions for incorporating the user's brand identity. This section references the user's uploaded brand sheet.

| Field | Description |
|-------|-------------|
| `uniform` | Instruction to use uniform from brand reference |
| `colors` | Instruction to match brand colors exactly |

**Example:**
```json
"branding": {
  "uniform": "uniform from the brand reference sheet",
  "colors": "uniform colors matching brand reference sheet exactly"
}
```

---

## Prompt Assembly Phases

When generating images, prompts are assembled in phases based on what personalization options the user has selected.

### Phase 1: Base Composition
The foundational image structure using `base_scene`, `camera`, `subject`, and `composition`.

```
A plumber working on a sink repair in the kitchen of a suburban home.

Camera: high angle, three-quarter view, wide shot, elevated approximately 
eye-level of standing person, looking down at the scene from the corner.

Subject: kneeling on the floor beside the open cabinet, crouched low with 
one knee down, torso leaning forward into the cabinet space, reaching into 
the cabinet under the sink to access the plumbing, facing away from camera 
at a three-quarter angle.

Composition: full body visible with kitchen environment context, toolbox 
positioned in foreground near the plumber's legs, kitchen cabinets and 
countertop with sink visible in background, cabinet door open creating 
visual frame with countertop edge providing leading line.
```

### Phase 2: Environment Customization
Adds the `environment` section for realistic, varied settings.

```
...previous content...

Environment: middle-class suburban family home, modern farmhouse kitchen with 
white shaker cabinets and butcher block counters. A few dishes in the sink, 
child's colorful artwork held by magnets on the refrigerator, a fruit bowl 
on the counter. Warm, welcoming family home with signs of daily life.
```

### Phase 3: Brand Personalization
Adds the `branding` section when a user has uploaded a brand sheet.

```
...previous content...

The worker is wearing the company uniform exactly as shown in the attached 
brand reference sheet, with uniform colors matching the brand reference 
sheet exactly.
```

### Phase 4: Identity Personalization (Future)
When implemented, this phase will add team member likeness using uploaded headshots.

```
...previous content...

The worker's face matches the person shown in the provided headshot reference. 
Maintain exact facial features, skin tone, and hair from headshot while 
adapting to the pose.
```

---

## Application Integration

### Database Storage

Prompts are stored as JSON in the database, allowing for:
- Easy querying and filtering by `shot_id`
- Programmatic manipulation of individual sections
- Version control of prompt libraries

### Prompt Assembly Function

```typescript
interface PromptData {
  shot_id: string;
  base_scene: string;
  camera: CameraSettings;
  subject: SubjectDetails;
  composition: CompositionDetails;
  environment: EnvironmentDetails;
  branding: BrandingInstructions;
}

function assemblePrompt(
  promptData: PromptData,
  options: {
    includeBranding: boolean;
    includeEnvironment: boolean;
    brandSheetUrl?: string;
    headshotUrl?: string;
  }
): string {
  let prompt = promptData.base_scene;
  
  // Add camera instructions
  prompt += `\n\nCamera: ${promptData.camera.angle}, ${promptData.camera.distance}, `;
  prompt += `${promptData.camera.height}, ${promptData.camera.perspective}.`;
  
  // Add subject details
  prompt += `\n\nSubject: ${promptData.subject.position}, ${promptData.subject.pose}, `;
  prompt += `${promptData.subject.action}, ${promptData.subject.orientation}.`;
  
  // Add composition
  prompt += `\n\nComposition: ${promptData.composition.framing}, `;
  prompt += `${promptData.composition.foreground} in foreground, `;
  prompt += `${promptData.composition.background} in background, `;
  prompt += `${promptData.composition.depth}.`;
  
  // Add environment if enabled
  if (options.includeEnvironment) {
    prompt += `\n\nEnvironment: ${promptData.environment.home_type}, `;
    prompt += `${promptData.environment.room_style}. `;
    prompt += `${promptData.environment.lived_in_details}. `;
    prompt += `${promptData.environment.atmosphere}.`;
  }
  
  // Add branding if user has brand sheet
  if (options.includeBranding && options.brandSheetUrl) {
    prompt += `\n\nThe worker is wearing ${promptData.branding.uniform}, `;
    prompt += `with ${promptData.branding.colors}.`;
  }
  
  return prompt;
}
```

### Image Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Selects Pack                        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Load Prompt Library (JSON)                    │
│                   e.g., plumbing_prompts.md                      │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Check User Personalization Options              │
│         • Has brand sheet? → Include branding section            │
│         • Has headshots? → Include identity section (future)     │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Assemble Final Prompts                        │
│              Combine sections based on user options              │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Send to Image Generation API                   │
│         Include brand sheet / headshot as image references       │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Store Generated Images                        │
│              Link to prompt shot_id for tracking                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Example: Full Prompt Assembly

### Input JSON
```json
{
  "shot_id": "TR1-01",
  "base_scene": "A plumber repairing or replacing a toilet in a residential bathroom",
  "camera": {
    "angle": "three-quarter front view",
    "distance": "medium shot",
    "height": "standing eye level, looking down",
    "perspective": "classic work-in-progress angle"
  },
  "subject": {
    "position": "kneeling beside the toilet on the bathroom floor",
    "pose": "one knee down, torso leaning toward toilet base, arms extended downward",
    "action": "using a wrench to tighten or loosen the bolts at the base of the toilet",
    "orientation": "three-quarter view facing the toilet"
  },
  "composition": {
    "framing": "full body with toilet and partial bathroom visible",
    "foreground": "toilet base and plumber's hands with wrench",
    "background": "bathroom wall and floor",
    "depth": "toilet creates middle ground interest"
  },
  "environment": {
    "home_type": "middle-class suburban family home",
    "room_style": "updated hall bathroom with white subway tile, gray vanity, and brushed nickel fixtures",
    "lived_in_details": "a basket of rolled towels on a shelf, kids' bath toys in a mesh bag, a toothbrush holder with multiple brushes",
    "atmosphere": "clean, functional family bathroom"
  },
  "branding": {
    "uniform": "uniform from the brand reference sheet",
    "colors": "uniform colors matching brand reference sheet exactly"
  }
}
```

### Output Prompt (with branding enabled)
```
A plumber repairing or replacing a toilet in a residential bathroom.

Camera: three-quarter front view, medium shot, standing eye level looking down, 
classic work-in-progress angle.

Subject: kneeling beside the toilet on the bathroom floor, one knee down with 
torso leaning toward toilet base and arms extended downward, using a wrench to 
tighten or loosen the bolts at the base of the toilet, three-quarter view 
facing the toilet.

Composition: full body with toilet and partial bathroom visible, toilet base 
and plumber's hands with wrench in foreground, bathroom wall and floor in 
background, toilet creates middle ground interest.

Environment: middle-class suburban family home, updated hall bathroom with 
white subway tile, gray vanity, and brushed nickel fixtures. A basket of 
rolled towels on a shelf, kids' bath toys in a mesh bag, a toothbrush holder 
with multiple brushes. Clean, functional family bathroom.

The worker is wearing the uniform from the brand reference sheet, with uniform 
colors matching the brand reference sheet exactly.
```

---

## Best Practices

### When Creating New Prompts

1. **Be specific about poses and actions** - Vague descriptions lead to inconsistent results
2. **Keep environments geographically neutral** - Avoid beach, mountain, lake, or region-specific themes
3. **Vary the environments** - Mix home types, styles, and lived-in details across a pack
4. **Use consistent terminology** - Match the field definitions in this document
5. **Test prompts individually** - Verify each prompt generates expected results before adding to library

### When Assembling Prompts

1. **Always include base sections** - `base_scene`, `camera`, `subject`, `composition`
2. **Conditionally include personalization** - Only add `branding` if user has uploaded brand sheet
3. **Attach reference images** - Brand sheets and headshots should be sent as image references to the API
4. **Log shot_ids** - Track which prompts were used for each generated image

---

## Prompt Library Files

| File | Description | Prompt Count |
|------|-------------|--------------|
| `references/plumbing/plumbing_prompts.md` | Sink repair and toilet repair/replacement | 56 prompts |

*Additional prompt libraries will be added as new photo packs are developed.*
