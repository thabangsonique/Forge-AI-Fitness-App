import React from "react";
import { Text, View } from "react-native";

type ProfileSectionProps = {
  title: string;
  children: React.ReactNode;
};

export default function ProfileSection({
  title,
  children,
}: ProfileSectionProps) {
  const items = React.Children.toArray(children);

  return (
    <View className="mt-7">
      <Text className="ml-1 text-xs font-medium uppercase tracking-widest text-muted-3">
        {title}
      </Text>

      <View className="mt-2 overflow-hidden rounded-3xl bg-muted/10">
        {items.map((child, index) => {
          const hasIcon =
            React.isValidElement<{ icon?: React.ReactNode }>(child) &&
            Boolean(child.props.icon);

          return (
            <React.Fragment key={index}>
              {child}
              {index < items.length - 1 ? (
                <View
                  className={`h-px bg-white/5 ${hasIcon ? "ml-12" : ""}`}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}
