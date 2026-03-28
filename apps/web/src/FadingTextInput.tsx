import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";

export interface FadingTextInputProps extends InputHTMLAttributes<HTMLInputElement> {}

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function hasRenderableValue(value: InputHTMLAttributes<HTMLInputElement>["value"]) {
  if (value === undefined || value === null) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.join("").trim().length > 0;
  }

  return String(value).trim().length > 0;
}

export const FadingTextInput = forwardRef<HTMLInputElement, FadingTextInputProps>(
  function FadingTextInput({ className, placeholder, value, ...props }, ref) {
    const filled = hasRenderableValue(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const placeholderRef = useRef<HTMLSpanElement>(null);
    const [overflowing, setOverflowing] = useState(false);

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, []);

    useEffect(() => {
      if (!placeholder) {
        setOverflowing(false);
        return;
      }

      const placeholderElement = placeholderRef.current;

      if (!placeholderElement) {
        setOverflowing(false);
        return;
      }

      const measureOverflow = () => {
        const nextOverflowing = placeholderElement.scrollWidth - placeholderElement.clientWidth > 1;
        setOverflowing((currentOverflowing) =>
          currentOverflowing === nextOverflowing ? currentOverflowing : nextOverflowing,
        );
      };

      measureOverflow();

      if (typeof ResizeObserver === "undefined") {
        return;
      }

      const resizeObserver = new ResizeObserver(() => {
        measureOverflow();
      });

      if (inputRef.current) {
        resizeObserver.observe(inputRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, [placeholder]);

    return (
      <div
        className="field__control field__control--fade"
        data-has-value={filled ? "true" : "false"}
        data-overflowing={overflowing ? "true" : "false"}
      >
        <input
          {...props}
          className={joinClassNames("field__input", className)}
          placeholder={placeholder}
          ref={inputRef}
          value={value}
        />
        {placeholder ? (
          <span
            aria-hidden="true"
            className="field__placeholder"
            ref={placeholderRef}
          >
            {placeholder}
          </span>
        ) : null}
      </div>
    );
  },
);
