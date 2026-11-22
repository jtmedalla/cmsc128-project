import { ANYONE_HURT_LABELS, anyoneHurtSchema, sexSchema } from '@repo/shared';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { SexLabel } from '@/components/sex-label';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ageInvalid, type VictimDraft, type VictimsValue } from '../victims';

/** One of a few choices, or none; picking the chosen one again clears it. */
function ChoiceToggle<T extends string>({
  label,
  options,
  value,
  onChange,
  labelOf,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (value: T | null) => void;
  labelOf: (option: T) => React.ReactNode;
}) {
  return (
    <ToggleGroup
      aria-label={label}
      variant="outline"
      size="sm"
      value={value ? [value] : []}
      onValueChange={(next) => onChange((next[0] as T | undefined) ?? null)}
    >
      {options.map((option) => (
        <ToggleGroupItem key={option} value={option}>
          {labelOf(option)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/**
 * "Anyone hurt?" as Yes, No or Don't know, unanswered until picked; after Yes, the people
 * hurt, each with sex, age and condition, any of which may stay unknown.
 */
export function VictimsField({
  value,
  onChange,
}: {
  value: VictimsValue;
  onChange: (value: VictimsValue) => void;
}) {
  const { anyoneHurt, victims } = value;
  const setVictim = (key: string, change: Partial<VictimDraft>) =>
    onChange({
      ...value,
      victims: victims.map((v) => (v.key === key ? { ...v, ...change } : v)),
    });
  const addVictim = () =>
    onChange({
      ...value,
      victims: [
        ...victims,
        { key: crypto.randomUUID(), sex: null, age: '', medicalCondition: '' },
      ],
    });
  const removeVictim = (key: string) =>
    onChange({ ...value, victims: victims.filter((v) => v.key !== key) });

  return (
    <>
      <Field>
        <FieldLabel>Anyone hurt?</FieldLabel>
        <ChoiceToggle
          label="Anyone hurt?"
          options={anyoneHurtSchema.options}
          value={anyoneHurt}
          onChange={(next) => onChange({ ...value, anyoneHurt: next })}
          labelOf={(answer) => ANYONE_HURT_LABELS[answer]}
        />
      </Field>
      {anyoneHurt === 'yes' && (
        <>
          {victims.map((victim, index) => {
            const invalid = ageInvalid(victim.age);
            return (
              <FieldSet key={victim.key}>
                <div className="flex items-center justify-between">
                  <FieldLegend variant="label">Person {index + 1}</FieldLegend>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove person ${index + 1}`}
                    onClick={() => removeVictim(victim.key)}
                  >
                    <X />
                  </Button>
                </div>
                <FieldGroup className="gap-3">
                  <div className="flex gap-3">
                    <Field className="w-fit">
                      <FieldLabel>Sex</FieldLabel>
                      <ChoiceToggle
                        label={`Person ${index + 1} sex`}
                        options={sexSchema.options}
                        value={victim.sex}
                        onChange={(sex) => setVictim(victim.key, { sex })}
                        labelOf={(sex) => <SexLabel sex={sex} />}
                      />
                    </Field>
                    <Field className="flex-1" data-invalid={invalid}>
                      <FieldLabel htmlFor={`${victim.key}-age`}>Age</FieldLabel>
                      <Input
                        id={`${victim.key}-age`}
                        placeholder="45, 60s, child or senior"
                        aria-invalid={invalid}
                        value={victim.age}
                        onChange={(event) =>
                          setVictim(victim.key, { age: event.target.value })
                        }
                      />
                      {invalid && (
                        <FieldError>
                          Try an age like 45, 60s or senior.
                        </FieldError>
                      )}
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor={`${victim.key}-condition`}>
                      Condition
                    </FieldLabel>
                    <Input
                      id={`${victim.key}-condition`}
                      placeholder="Bleeding, unconscious, can't walk"
                      value={victim.medicalCondition}
                      onChange={(event) =>
                        setVictim(victim.key, {
                          medicalCondition: event.target.value,
                        })
                      }
                    />
                  </Field>
                </FieldGroup>
              </FieldSet>
            );
          })}
          <Button variant="outline" size="sm" onClick={addVictim}>
            <Plus data-icon="inline-start" />
            Add person hurt
          </Button>
        </>
      )}
    </>
  );
}
