import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, FlatList } from 'react-native';
import { Provider as PaperProvider, TextInput, Button, Card, ProgressBar, IconButton, Provider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Type definitions
interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodLog extends FoodItem {
  logId: string;
}

// Pre-seeded food database for testing search
const INITIAL_FOOD_DATABASE: FoodItem[] = [
  { id: '1', name: 'Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: '2', name: 'Brown Rice (100g cooked)', calories: 111, protein: 2.6, carbs: 23, fat: 0.9 },
  { id: '3', name: 'Whole Egg (1 large)', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
  { id: '4', name: 'Avocado (1 medium)', calories: 240, protein: 3, carbs: 12, fat: 22 },
  { id: '5', name: 'Oatmeal (50g dry)', calories: 190, protein: 7, carbs: 32, fat: 3.5 },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // --- Profile State ---
  const [age, setAge] = useState('24');
  const [weight, setWeight] = useState('75');
  const [height, setHeight] = useState('175');
  const [gender, setGender] = useState('male');
  const [goal, setGoal] = useState('loss');

  // --- Food Tracker State ---
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>(INITIAL_FOOD_DATABASE);
  const [searchQuery, setSearchQuery] = useState('');
  const [todaysLogs, setTodaysLogs] = useState<FoodLog[]>([]);

  // --- Custom Food Form State ---
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');

  // --- Calculations ---
  const targets = useMemo(() => {
    const w = parseFloat(weight) || 0;
    const h = parseFloat(height) || 0;
    const a = parseFloat(age) || 0;

    if (!w || !h || !a) return { calories: 2000, protein: 150, carbs: 200, fat: 65 };

    let bmr = 10 * w + 6.25 * h - 5 * a;
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;

    const tdee = Math.round(bmr * 1.4);
    const targetCalories = goal === 'loss' ? tdee - 500 : tdee + 500;
    const targetProtein = Math.round((targetCalories * 0.30) / 4);
    const targetCarbs = Math.round((targetCalories * 0.45) / 4);
    const targetFat = Math.round((targetCalories * 0.25) / 9);

    return { calories: targetCalories, protein: targetProtein, carbs: targetCarbs, fat: targetFat };
  }, [age, weight, height, gender, goal]);

  const totals = useMemo(() => {
    return todaysLogs.reduce(
      (acc, item) => {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [todaysLogs]);

  // --- Actions ---
  const handleAddFoodLog = (food: FoodItem) => {
    setTodaysLogs([...todaysLogs, { ...food, logId: Date.now().toString() }]);
  };

  const handleRemoveLog = (logId: string) => {
    setTodaysLogs(todaysLogs.filter(item => item.logId !== logId));
  };

  const handleCreateCustomFood = () => {
    if (!customName || !customCalories) return;
    const newFood = {
      id: Date.now().toString(),
      name: customName,
      calories: parseInt(customCalories) || 0,
      protein: parseInt(customProtein) || 0,
      carbs: parseInt(customCarbs) || 0,
      fat: parseInt(customFat) || 0,
    };
    setFoodDatabase([newFood, ...foodDatabase]);
    setCustomName(''); setCustomCalories(''); setCustomProtein(''); setCustomCarbs(''); setCustomFat('');
  };

  const filteredFoods = foodDatabase.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PaperProvider>
      <View style={[styles.safeContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
          
          <Text style={styles.appTitle}>Fit Track</Text>

          {/* 1. USER PROFILE */}
          <Card style={styles.card}>
            <Card.Title title="Please share your fitness goals: " titleStyle={styles.cardTitle} />
            <Card.Content>
              <View style={styles.row}>
                <TextInput label="Age" value={age} onChangeText={setAge} keyboardType="numeric" style={[styles.input, { flex: 1 }]} mode="outlined" />
                <TextInput label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" style={[styles.input, { flex: 1, marginHorizontal: 8 }]} mode="outlined" />
                <TextInput label="Height (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" style={[styles.input, { flex: 1 }]} mode="outlined" />
              </View>

              <View style={styles.row}>
                <Button mode={gender === 'male' ? 'contained' : 'outlined'} onPress={() => setGender('male')} style={styles.toggleBtn}>Male</Button>
                <Button mode={gender === 'female' ? 'contained' : 'outlined'} onPress={() => setGender('female')} style={styles.toggleBtn}>Female</Button>
              </View>
              <View style={styles.row}>
                <Button mode={goal === 'loss' ? 'contained' : 'outlined'} onPress={() => setGoal('loss')} style={styles.toggleBtn}>Weight Loss</Button>
                <Button mode={goal === 'gain' ? 'contained' : 'outlined'} onPress={() => setGoal('gain')} style={styles.toggleBtn}>Weight Gain</Button>
              </View>
            </Card.Content>
          </Card>

          {/* 2. DASHBOARD */}
          <Card style={[styles.card, styles.dashboardCard]}>
            <Card.Content>
              <Text style={styles.dashboardHeading}>Daily Calories</Text>
              <Text style={styles.calorieCounter}>
                {totals.calories} / <Text style={{ color: '#6200ee' }}>{targets.calories} kcal</Text>
              </Text>
              <ProgressBar progress={Math.min(totals.calories / (targets.calories || 1), 1)} color="#6200ee" style={styles.progressBar} />

              <View style={[styles.row, { justifyContent: 'space-between', marginTop: 12 }]}>
                <View style={styles.macroBlock}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroVal}>{totals.protein}g / {targets.protein}g</Text>
                </View>
                <View style={styles.macroBlock}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroVal}>{totals.carbs}g / {targets.carbs}g</Text>
                </View>
                <View style={styles.macroBlock}>
                  <Text style={styles.macroLabel}>Fats</Text>
                  <Text style={styles.macroVal}>{totals.fat}g / {targets.fat}g</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* 3. TODAY'S LOGS */}
          <Card style={styles.card}>
            <Card.Title title="Today's Food Diary" titleStyle={styles.cardTitle} />
            <Card.Content>
              {todaysLogs.length === 0 ? (
                <Text style={styles.emptyText}>No food added today yet.</Text>
              ) : (
                todaysLogs.map((item) => (
                  <View key={item.logId} style={styles.logItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logName}>{item.name}</Text>
                      <Text style={styles.logDetails}>{item.calories} kcal | P: {item.protein}g C: {item.carbs}g F: {item.fat}g</Text>
                    </View>
                    <IconButton icon="delete" iconColor="red" size={20} onPress={() => handleRemoveLog(item.logId)} />
                  </View>
                ))
              )}
            </Card.Content>
          </Card>

          {/* 4. SEARCH & ADD FOOD */}
          <Card style={styles.card}>
            <Card.Title title="Search & Add Food" titleStyle={styles.cardTitle} />
            <Card.Content>
              <TextInput label="Search database..." value={searchQuery} onChangeText={setSearchQuery} mode="outlined" style={styles.input} left={<TextInput.Icon icon="magnify" />} />
              <FlatList
                data={filteredFoods}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.searchResultItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.foodName}>{item.name}</Text>
                      <Text style={styles.foodDetails}>{item.calories} kcal · P:{item.protein}g C:{item.carbs}g F:{item.fat}g</Text>
                    </View>
                    <Button compact mode="contained-tonal" onPress={() => handleAddFoodLog(item)}>Add</Button>
                  </View>
                )}
              />
            </Card.Content>
          </Card>

          {/* 5. CREATE CUSTOM FOOD */}
          <Card style={[styles.card, { marginBottom: 80 }]}>
            <Card.Title title="Can't find it? Add Custom Food" titleStyle={styles.cardTitle} />
            <Card.Content>
              <TextInput label="Food Name" value={customName} onChangeText={setCustomName} mode="outlined" style={styles.input} />
              <View style={styles.row}>
                <TextInput label="Calories" value={customCalories} onChangeText={setCustomCalories} keyboardType="numeric" mode="outlined" style={[styles.input, { flex: 1 }]} />
                <TextInput label="Protein (g)" value={customProtein} onChangeText={setCustomProtein} keyboardType="numeric" mode="outlined" style={[styles.input, { flex: 1, marginHorizontal: 6 }]} />
              </View>
              <View style={styles.row}>
                <TextInput label="Carbs (g)" value={customCarbs} onChangeText={setCustomCarbs} keyboardType="numeric" mode="outlined" style={[styles.input, { flex: 1 }]} />
                <TextInput label="Fat (g)" value={customFat} onChangeText={setCustomFat} keyboardType="numeric" mode="outlined" style={[styles.input, { flex: 1, marginLeft: 6 }]} />
              </View>
              <Button mode="contained" onPress={handleCreateCustomFood} style={{ marginTop: 8 }}>
                Save to Database
              </Button>
            </Card.Content>
          </Card>

        </ScrollView>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#f6f6f9' },
  container: { padding: 16 },
  appTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16, textAlign: 'center' },
  card: { marginBottom: 16, backgroundColor: '#ffffff', borderRadius: 12, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  dashboardCard: { backgroundColor: '#f0e6ff', borderColor: '#d3bfff', borderWidth: 1 },
  dashboardHeading: { fontSize: 14, color: '#6200ee', fontWeight: 'bold', textTransform: 'uppercase' },
  calorieCounter: { fontSize: 32, fontWeight: 'bold', marginVertical: 4, color: '#222' },
  progressBar: { height: 10, borderRadius: 5, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  input: { marginBottom: 8, backgroundColor: '#fff' },
  toggleBtn: { flex: 1, marginHorizontal: 4 },
  macroBlock: { flex: 1, alignItems: 'center' },
  macroLabel: { fontSize: 12, color: '#666', fontWeight: '600' },
  macroVal: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  emptyText: { color: '#888', fontStyle: 'italic', paddingVertical: 8 },
  logItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
  logName: { fontSize: 15, fontWeight: '600' },
  logDetails: { fontSize: 12, color: '#666' },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  foodName: { fontSize: 15, fontWeight: '500' },
  foodDetails: { fontSize: 12, color: '#777' }
});