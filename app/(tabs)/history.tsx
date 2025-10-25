import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Clock, CheckCircle, XCircle, Loader } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { BrowserTask } from '@/types/database';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<BrowserTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('browser_tasks')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} color="#10B981" />;
      case 'failed':
        return <XCircle size={20} color="#EF4444" />;
      case 'processing':
        return <Loader size={20} color="#6366F1" />;
      default:
        return <Clock size={20} color="#8B92B0" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderTask = ({ item }: { item: BrowserTask }) => (
    <TouchableOpacity style={styles.taskCard} testID={`task-${item.id}`}>
      <View style={styles.taskHeader}>
        {getStatusIcon(item.status)}
        <Text style={styles.taskType}>{item.task_type}</Text>
        <Text style={styles.taskDate}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={styles.taskDescription} numberOfLines={2}>
        {item.task_description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Task History',
          headerStyle: { backgroundColor: '#0A0E27' },
          headerTintColor: '#fff',
        }}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.centerContainer}>
            <Clock size={48} color="#8B92B0" />
            <Text style={styles.emptyTitle}>No Tasks Yet</Text>
            <Text style={styles.emptySubtitle}>
              Your browser automation history will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={tasks}
            renderItem={renderTask}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            testID="tasks-list"
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8B92B0',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#1A1F3A',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskType: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6366F1',
    textTransform: 'capitalize',
  },
  taskDate: {
    fontSize: 12,
    color: '#8B92B0',
  },
  taskDescription: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 20,
  },
});
