"use client"

import * as React from "react"
import { CheckIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  checkboxSize?: "sm" | "md" | "lg"
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checkboxSize = "md", label, ...props }, ref) => {
    const [checked, setChecked] = React.useState(props.checked || false)
    const inputRef = React.useRef<HTMLInputElement>(null)
    
    React.useEffect(() => {
      setChecked(!!props.checked)
    }, [props.checked])

    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6"
    }

    const iconSizeClasses = {
      sm: "w-3 h-3",
      md: "w-3.5 h-3.5",
      lg: "w-4 h-4"
    }
    
    const handleClick = () => {
      if (!props.disabled) {
        // Inversons l'état actuel
        const newCheckedState = !checked
        setChecked(newCheckedState)
        
        // Créons un événement de changement synthétique
        if (inputRef.current) {
          inputRef.current.checked = newCheckedState
          
          // Déclenchons l'événement onChange si fourni dans les props
          if (props.onChange) {
            const event = new Event('change', { bubbles: true })
            Object.defineProperty(event, 'target', {
              writable: false,
              value: { checked: newCheckedState, name: props.name }
            })
            
            props.onChange(event as unknown as React.ChangeEvent<HTMLInputElement>)
          }
        }
      }
    }
    
    return (
      <div className="flex items-center space-x-2">
        <div className="relative">
          <input
            type="checkbox"
            ref={(node) => {
              // Gérer à la fois le ref fourni par forwardRef et notre ref local
              if (typeof ref === 'function') {
                ref(node)
              } else if (ref) {
                ref.current = node
              }
              inputRef.current = node
            }}
            className="sr-only"
            {...props}
            onChange={(e) => {
              setChecked(e.target.checked)
              props.onChange?.(e)
            }}
          />
          <div
            onClick={handleClick}
            className={cn(
              `${sizeClasses[checkboxSize]} rounded border-2 flex items-center justify-center transition-all duration-200`,
              checked ? "bg-primary border-primary" : "border-gray-400 bg-background hover:border-primary/70",
              props.disabled ? "opacity-50 cursor-not-allowed border-gray-300" : "cursor-pointer",
              className
            )}
          >
            {checked && (
              <CheckIcon className={cn("text-primary-foreground", iconSizeClasses[checkboxSize])} />
            )}
          </div>
        </div>
        {label && (
          <label 
            onClick={!props.disabled ? handleClick : undefined}
            className={cn(
              "text-sm select-none", 
              props.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            )}
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }