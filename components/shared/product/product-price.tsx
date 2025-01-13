import { cn } from "@/lib/utils";

const ProductPrice = ({
    value,
    className,
}: {
    value: number;
    className?: string;
}) => {
    // ensure 2 decimal places
    const stringValue = value.toFixed(2);

    // get int and float
    const [intValue, floatValue] = stringValue.split(".");

    return (
        <p className={cn("text-2xl", className)}>
            <span className="text-xs align-super">$</span>
            <span className="">{intValue}</span>
            <span className="text-xs align-super">.{floatValue}</span>
        </p>
    );
};

export default ProductPrice;
