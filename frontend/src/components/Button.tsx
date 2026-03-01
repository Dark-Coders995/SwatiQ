import './Button.css'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  leftIcon?: React.ReactNode
}

export function Button({ variant = 'secondary', leftIcon, className, children, ...rest }: ButtonProps) {
  const classes = ['btn', `btn--${variant}`, className].filter(Boolean).join(' ')
  return (
    <button className={classes} {...rest}>
      {leftIcon && <span className="btn-icon">{leftIcon}</span>}
      <span>{children}</span>
    </button>
  )
}

