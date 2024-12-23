import { StyleSheet } from "react-native";
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#ddd",
    },
    logo: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#0066ff",
    },
    headerIcons: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 5,
    },
    icon: {
      marginHorizontal: 5,
    },
    notificationIcon: {
      position: "relative",
    },
    notificationBadge: {
      position: "absolute",
      right: -5,
      top: -5,
      backgroundColor: "red",
      borderRadius: 10,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    notificationText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "bold",
    },
    postInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#ddd",
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
    postInput: {
      flex: 1,
      height: 40,
      borderColor: "#ddd",
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 15,
    },
    menuContainer: {
      position: "absolute",
      right: 50,
      top: 50,
      backgroundColor: "#fff",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#ddd",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 5,
    },
    menuItem: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#ddd",
    },
    storyContainer: {
      flexDirection: "row",
      paddingHorizontal: 10,
    },
    storyCard: {
      width: 100,
      marginVertical: 10,
      alignItems: "center",
      marginHorizontal: 10,
    },
    storyCardImage: {
      width: 100,
      height: 150,
      borderRadius: 10,
    },
    storyCardText: {
      marginTop: 5,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-start",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      position: "absolute",
      backgroundColor: "white",
      padding: 10,
      borderRadius: 10,
      width: 190,
      zIndex: 999,
    },
    optionItem: {
      flexDirection: "row",
      paddingVertical: 5,
    },
    optionText: {
      color: "black",
      fontSize: 15,
      marginLeft: 10,
    },
  });
  export default styles;