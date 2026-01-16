import { useRef, useState, useEffect } from "react";
import "./Dropdown.css";

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}

export function Dropdown({ trigger, items, align = "left" }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen((prev) => !prev);

  const close = () => setIsOpen(false);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled) {
      item.onClick();
      close();
    }
  };

  return (
    <div className="dropdown-container" ref={containerRef}>
      <div
        className="dropdown-trigger"
        onClick={toggle}
        tabIndex={0}
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        {trigger}
      </div>
      {isOpen && (
        <div
          className={`dropdown-menu dropdown-menu-${align}`}
          ref={menuRef}
          role="menu"
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={`divider-${index}`} className="dropdown-divider" />;
            }

            return (
              <button
                key={index}
                className={`dropdown-item ${item.disabled ? "dropdown-item-disabled" : ""}`}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                role="menuitem"
              >
                {item.icon && <span className="dropdown-item-icon">{item.icon}</span>}
                <span className="dropdown-item-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
