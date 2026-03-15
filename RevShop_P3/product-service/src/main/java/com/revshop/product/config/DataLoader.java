package com.revshop.product.config;

import com.revshop.product.entity.Category;
import com.revshop.product.entity.Product;
import com.revshop.product.repository.CategoryRepository;
import com.revshop.product.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

/**
 * Data Loader
 * Seeds the database with initial categories and sample products
 */
@Configuration
public class DataLoader {

    private static final Logger log = LoggerFactory.getLogger(DataLoader.class);

    @Bean
    CommandLineRunner initDatabase(CategoryRepository categoryRepository, ProductRepository productRepository) {
        return args -> {
            log.info("Starting data initialization...");

            // Check if categories already exist
            if (categoryRepository.count() > 0) {
                log.info("Database already initialized. Skipping data loading.");
                return;
            }

            // Create categories
            List<Category> categories = Arrays.asList(
                    createCategory("Electronics", "Electronic devices and gadgets"),
                    createCategory("Fashion", "Clothing, shoes, and accessories"),
                    createCategory("Home & Kitchen", "Home appliances and kitchen items"),
                    createCategory("Books", "Books and reading materials"),
                    createCategory("Sports", "Sports equipment and fitness gear"),
                    createCategory("Beauty", "Beauty and personal care products"),
                    createCategory("Toys", "Toys and games for all ages"),
                    createCategory("Automotive", "Car parts and accessories")
            );

            List<Category> savedCategories = categoryRepository.saveAll(categories);
            log.info("Created {} categories", savedCategories.size());

            // Create sample products
            List<Product> sampleProducts = Arrays.asList(
                    createProduct("Wireless Headphones", "High-quality Bluetooth headphones",
                            79.99, 99.99, 50, savedCategories.get(0).getId(), 1L,
                            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"),
                    createProduct("Smart Watch", "Fitness tracking smartwatch",
                            199.99, 249.99, 30, savedCategories.get(0).getId(), 1L,
                            "https://images.unsplash.com/photo-1523275335684-37898b6baf30"),
                    createProduct("Men's T-Shirt", "Premium cotton t-shirt",
                            19.99, 29.99, 100, savedCategories.get(1).getId(), 2L,
                            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"),
                    createProduct("Coffee Maker", "Programmable coffee machine",
                            89.99, 119.99, 25, savedCategories.get(2).getId(), 2L,
                            "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6"),
                    createProduct("Programming Guide", "Complete guide to modern programming",
                            39.99, 49.99, 75, savedCategories.get(3).getId(), 1L,
                            "https://images.unsplash.com/photo-1532012197267-da84d127e765"),
                    createProduct("Yoga Mat", "Non-slip exercise mat",
                            24.99, 34.99, 60, savedCategories.get(4).getId(), 3L,
                            "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f")
            );

            List<Product> savedProducts = productRepository.saveAll(sampleProducts);
            log.info("Created {} sample products", savedProducts.size());

            log.info("Data initialization completed successfully!");
        };
    }

    private Category createCategory(String name, String description) {
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        return category;
    }

    private Product createProduct(String name, String description, Double price, Double mrp,
                                   Integer quantity, Long categoryId, Long sellerId, String imageUrl) {
        Product product = new Product();
        product.setName(name);
        product.setDescription(description);
        product.setPrice(price);
        product.setMrp(mrp);
        product.setQuantity(quantity);
        product.setCategoryId(categoryId);
        product.setSellerId(sellerId);
        product.setImageUrl(imageUrl);
        product.setActive(true);
        product.setStockThreshold(5);
        product.setRating(4.0 + Math.random()); // Random rating between 4.0 and 5.0
        return product;
    }
}
