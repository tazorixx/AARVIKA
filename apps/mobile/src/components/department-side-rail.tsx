import { useEffect, useRef } from 'react';
import { Platform, Pressable, ScrollView, Text, View, type ScrollViewInstance } from 'react-native';
import { router } from 'expo-router';
import { useCatalogue } from '../state/catalogue-context';
import type { DepartmentId } from '../domain/departments';
import { Icon, type IconName } from './illustration';
import { theme } from '../theme';

type RailTarget = DepartmentId | 'all';
const DIAMETER = 52;
const ITEM_HEIGHT = 60;
const VISIBLE_ITEMS = 5;
const shortNames: Partial<Record<RailTarget, string>> = {
  personalized: 'Custom', anniversary: 'Anniv.',
};

function RailItem({ id, title, active, onPress }: { id: RailTarget; title: string; active: boolean; onPress: () => void }) {
  return <View style={{ height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
    <Pressable
      testID={`side-rail-${id}`}
      accessibilityRole="button"
      accessibilityLabel={id === 'all' ? 'All departments' : title}
      accessibilityState={{ selected: active }}
      {...(Platform.OS === 'web' ? { 'aria-pressed': active } : {})}
      onPress={onPress}
      style={({ pressed }) => ({ width: DIAMETER, height: DIAMETER, borderRadius: DIAMETER / 2, alignItems: 'center', justifyContent: 'center', gap: 1, backgroundColor: active ? theme.colors.primary : pressed ? theme.colors.pale : 'white' })}
    >
      <Icon name={id === 'all' ? 'categories' : id as IconName} color={active ? 'white' : theme.colors.primary} size={19} />
      <Text numberOfLines={2} style={{ maxWidth: 49, textAlign: 'center', fontSize: 8.5, lineHeight: 10, fontWeight: active ? '700' : '600', color: active ? 'white' : theme.colors.plum }}>{shortNames[id] ?? title}</Text>
    </Pressable>
  </View>;
}

export function DepartmentSideRail({ activeId, pageHeight }: { activeId: RailTarget; pageHeight: number }) {
  const { departments } = useCatalogue();
  const scroll = useRef<ScrollViewInstance>(null);
  const active = departments.filter(department => department.active);
  const index = activeId === 'all' ? 0 : Math.max(0, active.findIndex(department => department.id === activeId) + 1);
  const height = Math.min(ITEM_HEIGHT * VISIBLE_ITEMS, Math.max(DIAMETER, pageHeight - 130));
  const center = Math.max(height / 2 + 8, Math.min(pageHeight * .57, pageHeight - height / 2 - 8));
  const offset = Math.max(0, index * ITEM_HEIGHT - Math.floor(height / ITEM_HEIGHT / 2) * ITEM_HEIGHT);

  useEffect(() => { scroll.current?.scrollTo({ y: offset, animated: false }); }, [offset]);

  function choose(id: RailTarget) {
    if (id === 'all') router.navigate('/categories');
    else if (id !== activeId) router.push(`/department/${id}`);
  }

  return <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, right: 0, width: 68, height: pageHeight, zIndex: 3 }}>
    <View testID="department-side-rail" style={{ position: 'absolute', top: center - height / 2, right: 8, width: 58, height, borderRadius: 29, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: 'white', overflow: 'hidden', elevation: 4, shadowColor: theme.colors.plum, shadowOffset: { width: -2, height: 2 }, shadowOpacity: .16, shadowRadius: 9 }}>
      <ScrollView
        ref={scroll}
        nestedScrollEnabled
        accessibilityLabel="Browse all departments"
        onContentSizeChange={() => scroll.current?.scrollTo({ y: offset, animated: false })}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'center' }}
      >
        <RailItem id="all" title="All" active={activeId === 'all'} onPress={() => choose('all')} />
        {active.map(department => <RailItem key={department.id} id={department.id} title={department.title} active={activeId === department.id} onPress={() => choose(department.id)} />)}
      </ScrollView>
    </View>
  </View>;
}
